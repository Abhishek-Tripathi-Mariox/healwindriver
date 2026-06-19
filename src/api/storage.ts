import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persistent session storage for the driver/staff app. */
export type AppRole = 'driver' | 'staff';

const K_TOKEN = 'hwd.token';
const K_ROLE = 'hwd.role';
const K_ID = 'hwd.id';
const K_PHONE = 'hwd.phone';
const K_DEVICE = 'hwd.deviceId';

/** Persisted React Navigation state — reopen on the same screen. */
export const NAV_STATE_KEY = 'hwd.navState';

export const storage = {
  getToken: () => AsyncStorage.getItem(K_TOKEN),
  getRole: async (): Promise<AppRole | null> =>
    (await AsyncStorage.getItem(K_ROLE)) as AppRole | null,
  getId: () => AsyncStorage.getItem(K_ID),
  getPhone: () => AsyncStorage.getItem(K_PHONE),

  async setSession(token: string, role: AppRole, id: string, phone?: string) {
    await AsyncStorage.setItem(K_TOKEN, token);
    await AsyncStorage.setItem(K_ROLE, role);
    await AsyncStorage.setItem(K_ID, id);
    if (phone) await AsyncStorage.setItem(K_PHONE, phone);
  },

  async clear() {
    await AsyncStorage.removeItem(K_TOKEN);
    await AsyncStorage.removeItem(K_ROLE);
    await AsyncStorage.removeItem(K_ID);
    await AsyncStorage.removeItem(NAV_STATE_KEY);
  },

  async getDeviceId(): Promise<string> {
    let id = await AsyncStorage.getItem(K_DEVICE);
    if (!id) {
      id = `rnd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem(K_DEVICE, id);
    }
    return id;
  },
};
