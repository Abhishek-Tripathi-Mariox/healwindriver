import { useSyncExternalStore } from 'react';

export type Role = 'driver' | 'staff';

let role: Role = 'driver';
const listeners = new Set<() => void>();

export const roleStore = {
  get: () => role,
  set(r: Role) {
    role = r;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export const useRole = (): Role => useSyncExternalStore(roleStore.subscribe, roleStore.get);
