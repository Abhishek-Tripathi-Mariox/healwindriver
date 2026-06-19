import { useSyncExternalStore } from 'react';
import { driverAuth, staffAuth } from '../api/auth';
import { setOnUnauthorized } from '../api/client';
import { storage, AppRole } from '../api/storage';
import { roleStore } from './roleStore';
import { dutyStore } from './dutyStore';
import { realtime } from '../services/realtime';
import { initPush, teardownPush } from '../services/push';

/**
 * Duty/online state lives on the server (isDutyOn/isOnline). The local
 * dutyStore is only a cache, so on every login/relaunch we must re-seed it from
 * the freshly fetched profile — otherwise a rebuild shows "Off duty" while the
 * backend (and admin) still has the crew online. sync=false so this seeding
 * doesn't POST back.
 */
const hydrateDuty = (role: AppRole, profile: any) => {
  const on =
    role === 'staff'
      ? !!(profile?.staff?.isDutyOn ?? profile?.staff?.isOnline)
      : !!(profile?.isOnline ?? profile?.driver?.isOnline);
  dutyStore.set(on, false);
};

/**
 * Central session store for both driver and ambulance-staff.
 * `status` drives the navigator: loading → splash, guest → auth, authed → app.
 */
export type AuthStatus = 'loading' | 'guest' | 'authed';

interface AuthState {
  status: AuthStatus;
  role: AppRole | null;
  id: string | null;
  profile: any | null;
}

let state: AuthState = { status: 'loading', role: null, id: null, profile: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<AuthState>) => {
  state = { ...state, ...patch };
  emit();
};

const fetchProfile = (role: AppRole) =>
  role === 'staff' ? staffAuth.profile() : driverAuth.profile();

export const authStore = {
  getSnapshot: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  async bootstrap() {
    const token = await storage.getToken();
    const role = await storage.getRole();
    if (!token || !role) {
      set({ status: 'guest' });
      return;
    }
    roleStore.set(role);
    try {
      const profile = await fetchProfile(role);
      set({ status: 'authed', role, id: await storage.getId(), profile });
      hydrateDuty(role, profile);
      void realtime.start(role);
      void initPush(role);
    } catch {
      await storage.clear();
      set({ status: 'guest', role: null, id: null, profile: null });
    }
  },

  async setSession(token: string, role: AppRole, id: string, phone?: string) {
    await storage.setSession(token, role, id, phone);
    roleStore.set(role);
    try {
      const profile = await fetchProfile(role);
      set({ status: 'authed', role, id, profile });
      hydrateDuty(role, profile);
    } catch {
      set({ status: 'authed', role, id, profile: null });
    }
    void realtime.start(role);
    void initPush(role);
  },

  async refreshProfile() {
    if (!state.role) return null;
    const profile = await fetchProfile(state.role);
    set({ profile });
    return profile;
  },

  async logout() {
    realtime.stop();
    void teardownPush();
    // Go off-duty (synced to backend) BEFORE we invalidate the session/token,
    // so admin dispatch stops seeing this crew as available.
    await dutyStore.set(false).catch(() => undefined);
    if (state.role === 'staff') await staffAuth.logout();
    else if (state.role === 'driver') await driverAuth.logout();
    await storage.clear();
    set({ status: 'guest', role: null, id: null, profile: null });
  },
};

setOnUnauthorized(() => {
  void authStore.logout();
});

export const useAuth = (): AuthState =>
  useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
