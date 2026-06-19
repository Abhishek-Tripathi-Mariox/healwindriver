import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { storage } from '../api/storage';

let onDuty = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Persist duty state to the backend for whichever role is logged in.
const syncRemote = async (v: boolean) => {
  const role = await storage.getRole();
  try {
    // Backend (+ validator) reads `isDutyOn`; sending `onDuty` alone failed
    // validation, so the crew never actually went online and admin dispatch
    // saw no available ambulance.
    if (role === 'staff') await api.post('/ambulance-staff/duty', { isDutyOn: v, onDuty: v });
    else if (role === 'driver') await api.post('/driver/status/toggle', { isOnline: v });
  } catch {
    /* best-effort */
  }
};

export const dutyStore = {
  get: () => onDuty,
  // Returns the remote-sync promise so callers (e.g. logout) can await the
  // backend update before the auth token is dropped.
  set(v: boolean, sync = true): Promise<void> {
    onDuty = v;
    emit();
    return sync ? syncRemote(v) : Promise.resolve();
  },
  toggle() {
    void this.set(!onDuty);
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export const useDuty = (): boolean => useSyncExternalStore(dutyStore.subscribe, dutyStore.get);
