import { Linking, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { driverApi } from '../api/driver';
import { staffApi } from '../api/staff';
import { socketService } from './socket';
import { AppAlert } from './appAlert';
import { storage } from '../api/storage';
import type { AppRole } from '../api/storage';

/**
 * Streams the device GPS while a dispatch is active so the patient/admin can
 * live-track the ambulance. Each fix is POSTed to the backend
 * (driver → /driver/location, staff → /ambulance-staff/location) and, for
 * drivers, also emitted over the socket (`driver:location:update`) which the
 * backend caches in Redis and relays to anyone tracking that driver.
 */

let watchId: number | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let lastPos: { lat: number; lng: number } | null = null;
let role: AppRole | null = null;

// Anyone (e.g. the ActiveDispatch screen) can subscribe to live position fixes
// to show a live distance to the patient without opening a second GPS watch.
const posListeners = new Set<(p: { lat: number; lng: number }) => void>();
export const subscribePosition = (
  cb: (p: { lat: number; lng: number }) => void,
): (() => void) => {
  posListeners.add(cb);
  return () => posListeners.delete(cb);
};
export const getLastPosition = (): { lat: number; lng: number } | null => lastPos;

// Only nag once per app session even though ensurePermission() runs on every
// location fetch — otherwise this would pop on every single call.
let backgroundPromptShown = false;

// Explains WHY we're about to ask for "Allow all the time" before the native
// OS dialogs fire, instead of only apologizing afterward via the Settings
// nudge below — crew are far more likely to grant background location when
// they understand it up front. Shown once per install.
let explainerPromise: Promise<void> | null = null;
const showBackgroundLocationExplainer = (): Promise<void> => {
  if (explainerPromise) return explainerPromise;
  explainerPromise = (async () => {
    if (await storage.getLocationExplainerShown()) return;
    await storage.setLocationExplainerShown();
    await new Promise<void>((resolve) => {
      AppAlert.alert(
        'Allow location access',
        'HealWin needs your location to receive dispatches and stream live tracking to the patient/admin — even while the app is in the background or the screen is locked. On the next screen, please choose "Allow all the time".',
        [{ text: 'Continue', onPress: () => resolve() }],
        { cancelable: false },
      );
    });
  })();
  return explainerPromise;
};

export const ensurePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    try {
      Geolocation.requestAuthorization();
    } catch {
      /* ignore */
    }
    return true;
  }
  await showBackgroundLocationExplainer();
  try {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    const fineOk = res === PermissionsAndroid.RESULTS.GRANTED;
    // On Android 10+ (API 29+) "Allow all the time" is a SEPARATE background
    // permission — request it after foreground is granted so the crew's live
    // location keeps streaming during a dispatch even when the app is
    // backgrounded / screen off.
    if (fineOk && Number(Platform.Version) >= 29) {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        );
      } catch {
        /* background is best-effort */
      }
      // Android 11+ (API 30+) never shows "Allow all the time" as an in-app
      // dialog option — Google requires that specific grant to come from
      // Settings, for every app, no exceptions. If it's still not granted
      // after the attempt above, guide the crew straight to this app's
      // Settings screen in one tap — critical here since live tracking during
      // a dispatch depends on it once the screen locks/app backgrounds.
      if (!backgroundPromptShown) {
        const bgGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ).catch(() => false);
        if (!bgGranted) {
          backgroundPromptShown = true;
          AppAlert.alert(
            'Keep live tracking working',
            'Android requires "Allow all the time" for Location so your position keeps streaming during a dispatch even when the app is backgrounded or the screen locks. This can only be turned on from Settings — tap below to open it directly.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void Linking.openSettings().catch(() => undefined) },
            ],
          );
        }
      }
    }
    return fineOk;
  } catch {
    return false;
  }
};

const push = (lat: number, lng: number) => {
  lastPos = { lat, lng };
  posListeners.forEach((l) => l({ lat, lng }));
  if (role === 'staff') void staffApi.updateLocation(lat, lng);
  else if (role === 'driver') {
    void driverApi.updateLocation(lat, lng);
    socketService.emit('driver:location:update', { lat, lng });
  }
};

const getPosition = (
  highAccuracy: boolean,
  timeout: number,
): Promise<{ lat: number; lng: number } | null> =>
  new Promise((resolve) => {
    let settled = false;
    // Hard fallback: some Android builds ignore the native `timeout` option and
    // leave a high-accuracy request hanging for MINUTES (no fix indoors, and no
    // timeout error ever fires). Guarantee we give up so callers never block.
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, timeout + 1500);
    const finish = (v: { lat: number; lng: number } | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(v);
    };
    Geolocation.getCurrentPosition(
      (pos) => finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => finish(null),
      { enableHighAccuracy: highAccuracy, timeout, maximumAge: 30000 },
    );
  });

/**
 * One-shot current position. Tries GPS first, then falls back to NETWORK/coarse
 * location (wifi/cell) so we still get an approximate fix when there's no GPS
 * satellite signal yet — enough to show a real distance until live GPS kicks in.
 */
export const getCurrentPositionOnce = async (): Promise<{ lat: number; lng: number } | null> => {
  const ok = await ensurePermission();
  if (!ok) return null;
  return (await getPosition(true, 8000)) ?? (await getPosition(false, 10000));
};

export const locationService = {
  get streaming() {
    return watchId !== null;
  },

  /**
   * Push ONE location to the backend without starting continuous streaming.
   * Used on the home screen so the vehicle gets a real (GPS-or-network) position
   * — and thus a real distance from the patient — even before the crew goes on
   * duty / before live GPS tracking is set up.
   */
  async sendOnce(forRole: AppRole | null) {
    if (!forRole) return;
    role = forRole;
    const p = await getCurrentPositionOnce();
    if (p) push(p.lat, p.lng);
  },

  async start(forRole: AppRole | null) {
    if (!forRole) return;
    if (watchId !== null && role === forRole) return;
    locationService.stop();
    role = forRole;
    const ok = await ensurePermission();
    if (!ok) return;
    // Send an immediate fix (GPS, else network) so the vehicle shows a fresh
    // location the moment the crew goes on duty — don't wait for the first
    // movement-triggered update.
    void getCurrentPositionOnce().then((p) => p && push(p.lat, p.lng));
    watchId = Geolocation.watchPosition(
      (pos) => push(pos.coords.latitude, pos.coords.longitude),
      () => {
        /* permission denied / no fix — keep trying via the watch */
      },
      { enableHighAccuracy: true, distanceFilter: 25, interval: 10000, fastestInterval: 5000 },
    );
    // Heartbeat: re-send the last known position every 60s. watchPosition only
    // fires after ~25m of movement, so a PARKED ambulance would otherwise stop
    // pinging and dispatch would mark it "stale location (no ping in 5 min)" and
    // refuse to dispatch it. This keeps lastLocationAt fresh while stationary.
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = setInterval(() => {
      if (lastPos) push(lastPos.lat, lastPos.lng);
    }, 60000);
  },

  stop() {
    if (watchId !== null) {
      try {
        Geolocation.clearWatch(watchId);
      } catch {
        /* ignore */
      }
      watchId = null;
    }
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  },
};
