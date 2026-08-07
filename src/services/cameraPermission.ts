import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request CAMERA at runtime before calling launchCamera(). Declaring the
 * permission in AndroidManifest.xml alone isn't enough on Android 6+ —
 * react-native-image-picker checks whether it's actually been GRANTED and,
 * if not, refuses to open the camera with a confusing "Camera unavailable /
 * This library does not require Manifest.permission.CAMERA…" alert instead
 * of prompting the user itself. Every camera-launch call site must request
 * this first.
 */
export const ensureCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};
