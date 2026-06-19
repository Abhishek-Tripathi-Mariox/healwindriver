import { useSyncExternalStore } from 'react';
import { driverApi } from '../api/driver';
import { staffApi } from '../api/staff';
import type { AppRole } from '../api/storage';

export type DispatchStatus = 'ACKNOWLEDGED' | 'EN_ROUTE' | 'ON_SCENE' | 'ON_TRIP' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * `dispatch` = ambulance emergency (staff, /dispatches/*); `booking` = ride
 * (driver, /driver/bookings/*); `request` = patient AmbulanceRequest / SOS
 * (staff, /ambulance-staff/requests/*).
 */
export type DispatchKind = 'dispatch' | 'booking' | 'request';

export interface Dispatch {
  id: string;
  kind: DispatchKind;
  patient: string;
  phone: string;
  pickup: string;
  drop: string;
  km: number;
  eta: number;
  fare: string;
  priority: Priority;
  status: DispatchStatus;
  // Patient pickup coordinates (when known) so the screen can show a LIVE
  // distance from the crew's own GPS instead of the static dispatch-time value.
  patientLat?: number;
  patientLng?: number;
}

interface DispatchState {
  incoming: Dispatch | null;
  active: Dispatch | null;
}

let state: DispatchState = { incoming: null, active: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<DispatchState>) => {
  state = { ...state, ...patch };
  emit();
};

const num = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normStatus = (s?: string): DispatchStatus => {
  switch (String(s || '').toUpperCase()) {
    case 'EN_ROUTE':
    case 'STARTED':
    case 'TRIP_STARTED':
      return 'EN_ROUTE';
    case 'ON_SCENE':
    case 'ARRIVED':
      return 'ON_SCENE';
    case 'ON_TRIP':
    case 'STARTED_TRIP':
      return 'ON_TRIP';
    case 'COMPLETED':
      return 'COMPLETED';
    default:
      return 'ACKNOWLEDGED';
  }
};

/** Build a Dispatch from an EmergencyDispatch doc or a `dispatch:incoming` payload. */
export const mapEmergencyDispatch = (raw: any): Dispatch | null => {
  if (!raw) return null;
  const coords = raw.patientLocation?.coordinates;
  const pLat = raw.patientLat != null ? Number(raw.patientLat) : coords ? coords[1] : undefined;
  const pLng = raw.patientLng != null ? Number(raw.patientLng) : coords ? coords[0] : undefined;
  return {
    id: String(raw.dispatchId || raw._id || raw.id || ''),
    kind: 'dispatch',
    patient: raw.patientName || raw.serviceName || 'Emergency patient',
    phone: raw.servicePhone || raw.patientPhone || '',
    pickup: raw.address || raw.patientAddress || (coords ? `${coords[1]}, ${coords[0]}` : 'Patient location'),
    drop: raw.serviceName || raw.hospitalName || 'Destination hospital',
    km: num(raw.roadDistanceKm ?? raw.distanceKm),
    eta: num(raw.etaMinutes ?? raw.estimatedArrival),
    fare: '',
    priority: (String(raw.priority || 'HIGH').toUpperCase() as Priority) || 'HIGH',
    status: normStatus(raw.status),
    patientLat: pLat,
    patientLng: pLng,
  };
};

/** Build a Dispatch from a ride Booking (`booking:request` payload or /driver/bookings/current). */
export const mapBooking = (raw: any): Dispatch | null => {
  if (!raw) return null;
  const fare = raw.estimatedFare ?? raw.fare ?? raw.totalFare;
  return {
    id: String(raw.bookingId || raw._id || raw.id || ''),
    kind: 'booking',
    patient: raw.user?.name || raw.customerName || raw.patientName || 'Patient',
    phone: raw.user?.phone || raw.customerPhone || raw.mobileNumber || '',
    pickup: raw.pickup?.address || raw.pickupAddress || 'Pickup',
    drop: raw.drop?.address || raw.destination?.address || raw.dropAddress || 'Drop',
    km: num(raw.distance ?? raw.driverDistance ?? raw.distanceKm),
    eta: num(raw.eta ?? raw.etaMinutes),
    fare: fare != null ? `₹ ${fare}` : '',
    priority: 'HIGH',
    status: normStatus(raw.status),
    patientLat: raw.pickup?.lat != null ? Number(raw.pickup.lat) : undefined,
    patientLng: raw.pickup?.lng != null ? Number(raw.pickup.lng) : undefined,
  };
};

/** Build a Dispatch from a patient AmbulanceRequest (`dispatch:incoming` with kind:'request' or /requests/active). */
export const mapAmbulanceRequest = (raw: any): Dispatch | null => {
  if (!raw) return null;
  const pickup = raw.pickup || {};
  return {
    id: String(raw.requestId || raw._id || raw.id || ''),
    kind: 'request',
    // "Booked for someone else" — the recipient's name/phone (the crew is
    // picking up this person, not the account holder).
    patient: raw.patientName || raw.recipientName || 'Patient',
    phone: raw.patientPhone || raw.recipientPhone || pickup.phone || '',
    pickup: raw.address || pickup.address || 'Patient location',
    drop: raw.drop?.address || 'Destination hospital',
    km: num(raw.distanceKm),
    eta: num(raw.etaMinutes),
    fare: '',
    priority: (String(raw.priority || 'HIGH').toUpperCase() as Priority) || 'HIGH',
    status: normStatus(raw.status),
    patientLat: pickup.lat != null ? Number(pickup.lat) : undefined,
    patientLng: pickup.lng != null ? Number(pickup.lng) : undefined,
  };
};

// FSM. Staff flows (dispatch/request) have an extra OTP-gated trip-start step:
//   ACKNOWLEDGED → EN_ROUTE → ON_SCENE → ON_TRIP → COMPLETED
// Driver ride bookings stay 4-state (no OTP):
//   ACKNOWLEDGED → EN_ROUTE → ON_SCENE → COMPLETED
const nextOf = (d: Dispatch): DispatchStatus => {
  const staffFlow = d.kind === 'dispatch' || d.kind === 'request';
  switch (d.status) {
    case 'ACKNOWLEDGED':
      return 'EN_ROUTE';
    case 'EN_ROUTE':
      return 'ON_SCENE';
    case 'ON_SCENE':
      return staffFlow ? 'ON_TRIP' : 'COMPLETED';
    case 'ON_TRIP':
      return 'COMPLETED';
    default:
      return 'COMPLETED';
  }
};

/** True when the next step is the OTP-verified trip start (patient pickup). */
export const otpRequired = (d: Dispatch | null): boolean =>
  !!d && (d.kind === 'dispatch' || d.kind === 'request') && nextOf(d) === 'ON_TRIP';

// The "Simulate incoming dispatch" dev/test helper rings a fake dispatch with
// this id. It has no backend record, so every lifecycle call (accept, reject,
// transitions) is short-circuited locally — otherwise the server 404s and the
// crew sees the alert silently bounce them back home.
export const SIMULATED_ID = 'SIMULATED';
const isSim = (d: Dispatch | null): boolean => !!d && d.id === SIMULATED_ID;

const accApi = (d: Dispatch) => {
  if (d.kind === 'dispatch') return staffApi.acceptDispatch(d.id);
  if (d.kind === 'request') return staffApi.requestAccept(d.id);
  return driverApi.accept(d.id);
};
const rejApi = (d: Dispatch, reason?: string) => {
  if (d.kind === 'dispatch') return staffApi.rejectDispatch(d.id, reason);
  // AmbulanceRequest reject releases the ambulance + reverts to SEARCHING so
  // admin can re-dispatch (same semantics as SOS dispatch reject).
  if (d.kind === 'request') return staffApi.requestReject(d.id);
  return driverApi.reject(d.id, reason);
};
const transitionApi = (d: Dispatch, to: DispatchStatus, otp?: string) => {
  if (d.kind === 'dispatch') {
    if (to === 'EN_ROUTE') return staffApi.enRoute(d.id);
    if (to === 'ON_SCENE') return staffApi.onScene(d.id);
    if (to === 'ON_TRIP') return staffApi.startDispatch(d.id, otp);
    return staffApi.completeDispatch(d.id);
  }
  if (d.kind === 'request') {
    if (to === 'EN_ROUTE') return staffApi.requestEnRoute(d.id);
    if (to === 'ON_SCENE') return staffApi.requestArrived(d.id);
    if (to === 'ON_TRIP') return staffApi.requestStart(d.id, otp);
    return staffApi.requestComplete(d.id);
  }
  if (to === 'EN_ROUTE') return driverApi.arrived(d.id);
  if (to === 'ON_SCENE') return driverApi.start(d.id);
  return driverApi.complete(d.id);
};

export const dispatchStore = {
  getSnapshot: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  /** A live ringing dispatch arrived (from socket). Ignore if it's already active. */
  setIncoming(d: Dispatch | null) {
    if (d && state.active?.id === d.id) return;
    set({ incoming: d });
  },
  clearIncoming() {
    set({ incoming: null });
  },

  /** Accept the ringing dispatch → moves it to `active`. */
  async acceptIncoming(): Promise<boolean> {
    const d = state.incoming;
    if (!d) return false;
    try {
      if (!isSim(d)) await accApi(d);
      set({ incoming: null, active: { ...d, status: 'ACKNOWLEDGED' } });
      return true;
    } catch {
      return false;
    }
  },

  async rejectIncoming(reason?: string) {
    const d = state.incoming;
    set({ incoming: null });
    if (d && !isSim(d)) await rejApi(d, reason).catch(() => undefined);
  },

  /**
   * Advance the active dispatch one step (calls backend; clears on COMPLETED).
   * For the OTP-gated trip-start step, pass the patient's OTP — on a wrong OTP
   * the backend rejects and we do NOT advance (returns false so the UI can
   * surface the error).
   */
  async advance(otp?: string): Promise<boolean> {
    const d = state.active;
    if (!d) return false;
    const to = nextOf(d);
    const gated = to === 'ON_TRIP' && otpRequired(d);
    if (!isSim(d)) {
      try {
        await transitionApi(d, to, otp);
      } catch (e) {
        // OTP step must succeed server-side; other steps stay optimistic.
        if (gated) return false;
      }
    }
    if (to === 'COMPLETED') set({ active: null });
    else set({ active: { ...d, status: to } });
    return true;
  },

  /** Apply a status update pushed from the server for the active dispatch. */
  applyStatus(id: string, status?: string) {
    const d = state.active;
    if (!d || d.id !== id) return;
    const next = normStatus(status);
    if (next === 'COMPLETED') set({ active: null });
    else set({ active: { ...d, status: next } });
  },

  clearActive() {
    set({ active: null });
  },

  /** Locally reflect the chosen drop-off hospital on the active dispatch. */
  setActiveDrop(address: string) {
    if (state.active) set({ active: { ...state.active, drop: address } });
  },

  /** On app start / home focus, pull any in-progress dispatch from the backend. */
  async hydrate(role: AppRole | null): Promise<void> {
    try {
      if (role === 'staff') {
        const res: any = await staffApi.activeDispatch();
        const raw = res?.dispatch ?? res;
        const d = mapEmergencyDispatch(raw);
        if (d && d.id) {
          if (String(raw?.status || '').toUpperCase() === 'DISPATCHED') {
            // Assigned but not yet accepted → ring it.
            set({ active: null });
            dispatchStore.setIncoming(d);
          } else {
            set({ active: d });
          }
          return;
        }
        // No EmergencyDispatch — fall back to a patient AmbulanceRequest (SOS / booking).
        const rr: any = await staffApi.activeRequest();
        const reqDoc = rr?.request ?? rr;
        const rd = mapAmbulanceRequest(reqDoc);
        set({ active: rd && rd.id ? rd : null });
      } else if (role === 'driver') {
        const res: any = await driverApi.currentBooking();
        const d = mapBooking(res?.booking ?? res);
        set({ active: d && d.id ? d : null });
      }
    } catch {
      /* no active dispatch */
    }
  },

  reset() {
    set({ incoming: null, active: null });
  },
};

export const useActiveDispatch = (): Dispatch | null =>
  useSyncExternalStore(dispatchStore.subscribe, () => dispatchStore.getSnapshot().active);

export const useIncomingDispatch = (): Dispatch | null =>
  useSyncExternalStore(dispatchStore.subscribe, () => dispatchStore.getSnapshot().incoming);
