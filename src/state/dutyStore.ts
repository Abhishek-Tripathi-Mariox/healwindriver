import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { storage } from '../api/storage';

let onDuty = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Persist duty state to the backend for whichever role is logged in. Throws on
// failure so `set()` can revert + surface an error (previously this swallowed
// errors, so a failed toggle silently "did nothing").
const syncRemote = async (v: boolean, reasonId?: string) => {
  const role = await storage.getRole();
  if (role === 'staff') {
    // Going off-duty can carry an admin-managed reason (`reasonId`).
    await api.post('/ambulance-staff/duty', { isDutyOn: v, ...(reasonId ? { reasonId } : {}) });
  } else if (role === 'driver') {
    await api.post('/driver/status/toggle', { isOnline: v });
  }
};

export const dutyStore = {
  get: () => onDuty,
  // Optimistically flips the UI, then persists. On backend failure it REVERTS
  // and resolves `false` so the caller can show an error (never throws, so
  // fire-and-forget callers like logout stay safe).
  async set(v: boolean, sync = true, reasonId?: string): Promise<boolean> {
    const prev = onDuty;
    onDuty = v;
    emit();
    if (!sync) return true;
    try {
      await syncRemote(v, reasonId);
      return true;
    } catch {
      onDuty = prev;
      emit();
      return false;
    }
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
