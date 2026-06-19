import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { driverApi } from '../api/driver';
import { staffApi } from '../api/staff';
import { socketService } from './socket';
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

export const ensurePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    try {
      Geolocation.requestAuthorization();
    } catch {
      /* ignore */
    }
    return true;
  }
  try {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
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
    Geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
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
