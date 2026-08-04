import { launchCamera, type CameraOptions } from 'react-native-image-picker';
import { Image as ImageCompressor } from 'react-native-compressor';
import type { PhotoFile } from '../api/upload';

/**
 * Front-camera-only (no gallery) so a duty-on check-in photo is actually a
 * live selfie, not an old picture — matches the point of the check.
 */
const CAMERA_OPTS: CameraOptions = {
  mediaType: 'photo',
  cameraType: 'front',
  saveToPhotos: false,
  includeBase64: false,
};

/**
 * Opens the front camera for a duty-on check-in selfie, compresses it, and
 * returns it ready to upload. Null if the crew member cancels. Throws on
 * picker errors.
 */
export const captureDutySelfie = async (): Promise<PhotoFile | null> => {
  const res = await launchCamera(CAMERA_OPTS);
  if (res.didCancel) return null;
  if (res.errorCode) {
    throw new Error(res.errorMessage || 'Could not open the camera.');
  }
  const asset = res.assets?.[0];
  if (!asset?.uri) return null;
  const uri = await ImageCompressor.compress(asset.uri, {
    compressionMethod: 'auto',
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.7,
  });
  const ext = (asset.type?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  return {
    uri,
    name: asset.fileName || `duty_selfie_${Date.now()}.${ext}`,
    type: asset.type || 'image/jpeg',
  };
};
