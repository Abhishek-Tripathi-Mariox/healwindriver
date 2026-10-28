/**
 * Why a crew cannot take a run.
 *
 * Mirrors `CREW_CANCEL_REASONS` in the backend's
 * `services/dispatch-cancel.service.ts`. The server validates against its own
 * copy and falls back to a generic label, so an app that drifts behind is
 * safe — it just records a less specific reason. Keep the codes identical.
 */
export interface CancelReason {
  code: string;
  label: string;
}

export const CREW_CANCEL_REASONS: CancelReason[] = [
  {code: 'vehicle_breakdown', label: 'Vehicle breakdown'},
  {code: 'out_of_fuel', label: 'Out of fuel'},
  {code: 'too_far', label: 'Too far to reach in time'},
  {code: 'traffic_blocked', label: 'Blocked by traffic'},
  {code: 'wrong_assignment', label: 'Wrong assignment'},
  {code: 'crew_unavailable', label: 'Crew unavailable'},
  {code: 'medical_emergency', label: 'Crew medical emergency'},
  {code: 'other', label: 'Other'},
];
