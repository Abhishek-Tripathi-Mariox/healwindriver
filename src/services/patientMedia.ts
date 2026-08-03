import { AppAlert } from './appAlert';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImageLibraryOptions,
} from 'react-native-image-picker';
import { Image as ImageCompressor, Video as VideoCompressor } from 'react-native-compressor';

import type { PhotoFile } from '../api/upload';

const MAX_VIDEO_SECONDS = 120;

const PICK_OPTS: ImageLibraryOptions = {
  mediaType: 'mixed',
  selectionLimit: 0, // 0 = unlimited multi-select from the gallery
  includeBase64: false,
};

// Caps recording length in-camera; gallery picks still need the post-pick
// duration check below since a library video can already be longer.
const CAMERA_OPTS: CameraOptions = {
  ...PICK_OPTS,
  saveToPhotos: false,
  durationLimit: MAX_VIDEO_SECONDS,
};

const chooseSource = (): Promise<'camera' | 'library' | null> =>
  new Promise((resolve) => {
    AppAlert.alert(
      'Patient photo/video',
      'Choose a source',
      [
        { text: 'Take photo/video', onPress: () => resolve('camera') },
        { text: 'Choose from gallery', onPress: () => resolve('library') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });

const isVideo = (a: Asset): boolean => !!a.type?.startsWith('video/');

/** Compress one picked asset in place, returning an uploadable file. */
const compress = async (a: Asset): Promise<PhotoFile | null> => {
  if (!a.uri) return null;
  if (isVideo(a)) {
    const uri = await VideoCompressor.compress(a.uri, { compressionMethod: 'auto' });
    return { uri, name: a.fileName || `patient_${Date.now()}.mp4`, type: 'video/mp4' };
  }
  const uri = await ImageCompressor.compress(a.uri, {
    compressionMethod: 'auto',
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.7,
  });
  const ext = (a.type?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  return { uri, name: a.fileName || `patient_${Date.now()}.${ext}`, type: a.type || 'image/jpeg' };
};

/**
 * Prompt for a source, open the camera/gallery, compress every picked photo
 * or video, and return them ready to upload. Empty array if the user
 * cancelled. Throws on picker errors.
 */
export const pickPatientMedia = async (): Promise<PhotoFile[]> => {
  const source = await chooseSource();
  if (!source) return [];
  const res =
    source === 'camera'
      ? await launchCamera(CAMERA_OPTS)
      : await launchImageLibrary(PICK_OPTS);
  if (res.didCancel) return [];
  if (res.errorCode) {
    throw new Error(res.errorMessage || 'Could not open the photo/video picker.');
  }
  const assets = res.assets || [];

  // The camera enforces durationLimit while recording, but a gallery pick can
  // already be longer — drop those (with a heads-up) before compressing.
  const tooLong = assets.filter((a) => isVideo(a) && (a.duration ?? 0) > MAX_VIDEO_SECONDS);
  const withinLimit = assets.filter((a) => !tooLong.includes(a));
  if (tooLong.length) {
    AppAlert.alert(
      'Video too long',
      `Videos must be ${MAX_VIDEO_SECONDS} seconds or less. ${tooLong.length} video${tooLong.length > 1 ? 's were' : ' was'} skipped.`,
    );
  }

  const files = await Promise.all(withinLimit.map(compress));
  return files.filter((f): f is PhotoFile => !!f);
};
