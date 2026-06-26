import { socketService } from './socket';
import { locationService } from './location';
import { dutyStore } from '../state/dutyStore';
import {
  dispatchStore,
  mapBooking,
  mapEmergencyDispatch,
  mapAmbulanceRequest,
} from '../state/dispatchStore';
import type { AppRole } from '../api/storage';

/**
 * Wires the socket stream to the dispatch store + navigation. When the admin
 * assigns an ambulance (or the auto-dispatcher offers a booking), the backend
 * pushes to `user:<id>`; we surface it as the ringing IncomingDispatch screen
 * and keep the active dispatch's status in sync as it advances.
 */

let unsubs: Array<() => void> = [];

const ringIncoming = (raw: any, role: AppRole) => {
  // Off-duty crew are unavailable — never ring a new dispatch / SOS at them.
  // (Status updates for an already-active dispatch go through applyStatus, so
  // this only suppresses brand-new incoming alerts while off duty.)
  if (!dutyStore.get()) return;
  let d;
  if (role === 'driver') d = mapBooking(raw);
  else if (raw?.kind === 'request') d = mapAmbulanceRequest(raw); // patient SOS / booking
  else d = mapEmergencyDispatch(raw); // SOS EmergencyDispatch
  if (!d || !d.id) return;
  // App-level effect watches `incoming` and presents the IncomingDispatch modal.
  dispatchStore.setIncoming(d);
};

export const realtime = {
  async start(role: AppRole | null) {
    realtime.stop();
    await socketService.connect();
    // Pull any in-progress dispatch so a relaunch lands back on it.
    await dispatchStore.hydrate(role);

    // Stream GPS while on duty OR while a dispatch is active, so the patient
    // can see how far the ambulance is. (On-duty covers patient-app
    // AmbulanceRequest assignments; active dispatch covers SOS EmergencyDispatch.)
    const syncLocation = () => {
      if (dutyStore.get() || dispatchStore.getSnapshot().active) void locationService.start(role);
      else locationService.stop();
    };
    unsubs.push(dispatchStore.subscribe(syncLocation), dutyStore.subscribe(syncLocation));
    syncLocation();

    if (role === 'staff') {
      unsubs.push(
        socketService.on('dispatch:incoming', (d) => ringIncoming(d, 'staff')),
        // Attendant gets the "patient inbound" variant — same ring, info modal.
        socketService.on('dispatch:incoming_info', (d) => ringIncoming(d, 'staff')),
        socketService.on('dispatch:status', (d) =>
          dispatchStore.applyStatus(String(d?.dispatchId || ''), d?.status),
        ),
        socketService.on('dispatch:cancelled', () => {
          dispatchStore.clearIncoming();
          dispatchStore.clearActive();
        }),
        socketService.on('dispatch:resolved', () => dispatchStore.clearActive()),
      );
    } else if (role === 'driver') {
      unsubs.push(
        socketService.on('booking:request', (d) => ringIncoming(d, 'driver')),
        socketService.on('booking:status', (d) =>
          dispatchStore.applyStatus(String(d?.bookingId || ''), d?.status),
        ),
        socketService.on('booking:cancelled', () => {
          dispatchStore.clearIncoming();
          dispatchStore.clearActive();
        }),
        socketService.on('booking:closed', () => dispatchStore.clearIncoming()),
      );
    }
  },

  stop() {
    unsubs.forEach((u) => u());
    unsubs = [];
    locationService.stop();
    socketService.disconnect();
    dispatchStore.reset();
  },
};
