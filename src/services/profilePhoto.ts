import { Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImageLibraryOptions,
} from 'react-native-image-picker';

import { driverApi } from '../api/driver';
import { staffApi } from '../api/staff';
import { authStore } from '../state/authStore';
import type { PhotoFile } from '../api/upload';
import type { AppRole } from '../api/storage';

const PICK_OPTS: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 0.7,
  maxWidth: 1080,
  maxHeight: 1080,
  includeBase64: false,
  selectionLimit: 1,
};

const toFile = (a: Asset): PhotoFile | null => {
  if (!a.uri) return null;
  const ext = (a.type?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  return {
    uri: a.uri,
    name: a.fileName || `profile_${Date.now()}.${ext}`,
    type: a.type || 'image/jpeg',
  };
};

const chooseSource = (): Promise<'camera' | 'library' | null> =>
  new Promise((resolve) => {
    Alert.alert(
      'Profile photo',
      'Choose a source',
      [
        { text: 'Take photo', onPress: () => resolve('camera') },
        { text: 'Choose from gallery', onPress: () => resolve('library') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });

/**
 * Prompt for a source, open the camera/gallery, and return the picked image as
 * an uploadable file — or null if the user cancelled. Throws on picker errors.
 */
export const pickProfilePhoto = async (): Promise<PhotoFile | null> => {
  const source = await chooseSource();
  if (!source) return null;
  const res =
    source === 'camera'
      ? await launchCamera({ ...PICK_OPTS, saveToPhotos: false })
      : await launchImageLibrary(PICK_OPTS);
  if (res.didCancel) return null;
  if (res.errorCode) {
    throw new Error(res.errorMessage || 'Could not open the photo picker.');
  }
  const file = res.assets?.[0] ? toFile(res.assets[0]) : null;
  if (!file) throw new Error('No image was selected.');
  return file;
};

/** Upload the photo for the signed-in role, then refresh the cached profile. */
export const uploadProfilePhoto = async (role: AppRole | null, file: PhotoFile): Promise<void> => {
  if (role === 'staff') await staffApi.updateProfilePhoto(file);
  else if (role === 'driver') await driverApi.updateProfilePhoto(file);
  else throw new Error('Unknown role.');
  await authStore.refreshProfile();
};
