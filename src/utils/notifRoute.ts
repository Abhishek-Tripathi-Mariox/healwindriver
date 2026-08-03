/**
 * Where a notification should take the crew when tapped.
 *
 * The backend puts a screen name in `data.route` / `data.screen`. Some of those
 * were historically sent with different names than the actual navigator routes
 * (e.g. "StockRequests" vs the real `StockRequest`), which made taps silently do
 * nothing — so we normalise through ALIASES and only allow known screens.
 */

const ALIASES: Record<string, string> = {
  StockRequests: 'StockRequest',
  StockRequestScreen: 'StockRequest',
  Leave: 'ApplyLeave',
  Leaves: 'ApplyLeave',
  LeaveRequests: 'ApplyLeave',
  Dispatch: 'ActiveDispatch',
  Notification: 'StaffNotifications',
  Notifications: 'StaffNotifications',
};

/** Screens a notification is allowed to deep-link to. */
const NAV_TARGETS = new Set([
  'Tickets',
  'TicketDetail',
  'StockRequest',
  'ApplyLeave',
  'AddLeave',
  'Shifts',
  'ShiftDetail',
  'Trips',
  'TripDetail',
  'TripHistory',
  'CaseNotes',
  'AddPatient',
  'ActiveDispatch',
  'Earnings',
  'StaffEarnings',
  'DriverWallet',
  'StaffNotifications',
]);

/** Resolve a notification payload to a safe navigator target (or nothing). */
export const resolveNotifRoute = (
  data?: Record<string, any>,
): { target?: string; params?: any } => {
  const raw = (data?.route || data?.screen) as string | undefined;
  if (!raw) return {};
  const target = ALIASES[raw] || raw;
  return NAV_TARGETS.has(target) ? { target, params: data } : {};
};
