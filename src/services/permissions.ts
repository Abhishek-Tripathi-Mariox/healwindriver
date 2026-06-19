import { ensurePermission as ensureLocationPermission } from './location';
import { requestNotificationPermission } from './push';

/**
 * Request the runtime permissions a dispatch app needs — notifications (so
 * admin dispatch pushes arrive) and location (so the patient/admin can live
 * track the ambulance) — up front when the crew lands on their home screen.
 * Best-effort and idempotent: already-granted permissions don't re-prompt, and
 * a denial never throws (the user can re-grant from system settings later).
 */
export const ensureAppPermissions = async (): Promise<void> => {
  try {
    await requestNotificationPermission();
  } catch {
    /* ignore */
  }
  try {
    await ensureLocationPermission();
  } catch {
    /* ignore */
  }
};
