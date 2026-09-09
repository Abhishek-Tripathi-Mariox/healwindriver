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
import { ensureCameraPermission } from './cameraPermission';

const MAX_VIDEO_SECONDS = 120;

const PICK_OPTS: ImageLibraryOptions = {
  mediaType: 'mixed',
  selectionLimit: 0, // 0 = unlimited multi-select from the gallery
  includeBase64: false,
};

/**
 * The camera must be told photo OR video — it cannot offer both.
 *
 * Android launches the camera through an intent, and there are two separate
 * ones: ACTION_IMAGE_CAPTURE and ACTION_VIDEO_CAPTURE. react-native-image-picker
 * maps `mediaType: 'mixed'` onto the IMAGE intent (see its
 * ImagePickerModuleImpl#launchCamera), so asking for 'mixed' silently opened a
 * stills-only camera with no way to record — exactly what it looked like to
 * the crew. The gallery has no such limit and still accepts both.
 */
const cameraOptsFor = (kind: 'photo' | 'video'): CameraOptions => ({
  ...PICK_OPTS,
  mediaType: kind,
  saveToPhotos: false,
  // Caps recording length in-camera; gallery picks still need the post-pick
  // duration check below, since a library video can already be longer.
  durationLimit: MAX_VIDEO_SECONDS,
});

type Source = 'photo' | 'video' | 'library';

const chooseSource = (): Promise<Source | null> =>
  new Promise((resolve) => {
    AppAlert.alert(
      'Patient photo/video',
      'What would you like to capture?',
      [
        { text: 'Take photo', onPress: () => resolve('photo') },
        { text: 'Record video', onPress: () => resolve('video') },
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
  const usingCamera = source === 'photo' || source === 'video';
  if (usingCamera && !(await ensureCameraPermission())) {
    throw new Error('Camera permission is required to take a photo/video.');
  }
  const res = usingCamera
    ? await launchCamera(cameraOptsFor(source))
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
