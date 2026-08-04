import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import { storage } from '../api/storage';
import type { PhotoFile } from '../api/upload';

let onDuty = false;
let lastDutyMeta: { distanceMeters?: number; withinGeofence?: boolean } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Persist duty state to the backend for whichever role is logged in. Throws on
// failure so `set()` can revert + surface an error (previously this swallowed
// errors, so a failed toggle silently "did nothing").
const syncRemote = async (
  v: boolean,
  reasonId?: string,
  photo?: PhotoFile,
  lat?: number,
  lng?: number,
) => {
  const role = await storage.getRole();
  if (role === 'staff') {
    if (v && photo) {
      // Multipart when a check-in selfie is attached (going on duty) — the
      // backend geofences it against the crew member's assigned Centre where
      // one exists (informational only, never blocks the toggle).
      const form = new FormData();
      form.append('isDutyOn', 'true');
      if (lat != null) form.append('lat', String(lat));
      if (lng != null) form.append('lng', String(lng));
      form.append('photo', photo as any);
      const res = await api.postForm<{ distanceMeters?: number; withinGeofence?: boolean }>(
        '/ambulance-staff/duty',
        form,
      );
      lastDutyMeta = { distanceMeters: res?.distanceMeters, withinGeofence: res?.withinGeofence };
    } else {
      // Going off-duty can carry an admin-managed reason (`reasonId`).
      await api.post('/ambulance-staff/duty', { isDutyOn: v, ...(reasonId ? { reasonId } : {}) });
      lastDutyMeta = null;
    }
  } else if (role === 'driver') {
    await api.post('/driver/status/toggle', { isOnline: v });
  }
};

export const dutyStore = {
  get: () => onDuty,
  getLastDutyMeta: () => lastDutyMeta,
  // Optimistically flips the UI, then persists. On backend failure it REVERTS
  // and resolves `false` so the caller can show an error (never throws, so
  // fire-and-forget callers like logout stay safe).
  async set(
    v: boolean,
    sync = true,
    reasonId?: string,
    photo?: PhotoFile,
    lat?: number,
    lng?: number,
  ): Promise<boolean> {
    const prev = onDuty;
    onDuty = v;
    emit();
    if (!sync) return true;
    try {
      await syncRemote(v, reasonId, photo, lat, lng);
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
