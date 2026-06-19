import { Platform, PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission as fbRequestPermission,
  getInitialNotification,
  onNotificationOpenedApp,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { registerDevice } from '../api/auth';
import type { AppRole } from '../api/storage';

/**
 * Firebase Cloud Messaging (modular API — RNFirebase v22+) for driver + staff.
 *
 * Flow: request permission → get FCM token → register it with the backend
 * (driver → /driver/notifications/fcm-token, staff → /ambulance-staff/fcm-token)
 * so the admin's "Emergency Dispatch" push (dispatch channel) reaches this
 * device even when the app is backgrounded/killed. The background handler is
 * registered at the top level (index.js). Every entry point is guarded so the
 * app runs normally when Firebase isn't configured.
 */

const msg = () => getMessaging(getApp());
const platform = (): 'android' | 'ios' => (Platform.OS === 'ios' ? 'ios' : 'android');

let currentToken: string | null = null;
let onNavigate: ((route: string, params?: any) => void) | null = null;

/** Let the app route notification taps once the navigator is ready. */
export const setPushNavigator = (fn: (route: string, params?: any) => void) => {
  onNavigate = fn;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  const status = await fbRequestPermission(msg());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
};

const handleRoute = (data?: { [key: string]: any }) => {
  // Admin dispatch pushes carry `action: incoming_dispatch` — the live socket
  // already rings the IncomingDispatch modal, so a tap just needs to open the app.
  const route = (data?.route as string | undefined) || undefined;
  if (route && onNavigate) onNavigate(route, data);
};

/**
 * Initialize FCM for the given role. Safe to call after login (re-registers the
 * token so it links to the now-authenticated driver/staff). Never throws.
 */
export const initPush = async (role: AppRole | null): Promise<void> => {
  if (!role) return;
  try {
    // Permission gates DISPLAY only — register the token regardless so the
    // backend can target this device (Android token is valid without the grant).
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.log('[push] permission not granted — registering token anyway');
    }

    currentToken = await getToken(msg());
    if (currentToken) await registerDevice(role, currentToken, platform());

    onTokenRefresh(msg(), async (token) => {
      currentToken = token;
      await registerDevice(role, token, platform()).catch(() => undefined);
    });

    onNotificationOpenedApp(msg(), (m) => handleRoute(m?.data));

    const initial = await getInitialNotification(msg());
    if (initial) handleRoute(initial.data);
  } catch {
    // Best-effort — missing google-services / no Play Services etc.
  }
};

/** Foreground message subscription — returns an unsubscribe fn. */
export const subscribeForeground = (
  onMsg: (title: string, body: string, data?: any) => void,
): (() => void) => {
  try {
    return onMessage(msg(), async (m) => {
      const n = m.notification;
      onMsg(n?.title || 'HealWin', n?.body || '', m.data);
    });
  } catch {
    return () => {};
  }
};

/** Clear local token (call on logout). */
export const teardownPush = async (): Promise<void> => {
  currentToken = null;
};
