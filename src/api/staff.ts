import { api } from './client';
import { photoFormData, type PhotoFile } from './upload';

/** Ambulance-staff endpoints (/ambulance-staff/*). */
export const staffApi = {
  me: () => api.get('/ambulance-staff/me'),
  // Self-service profile edit (mobile/role/hospital stay admin-managed).
  updateProfile: (data: { fullName?: string; email?: string; gender?: string; dob?: string }) =>
    api.put('/ambulance-staff/profile', data),
  // Backend expects the file under the field name "profilePhoto".
  updateProfilePhoto: (file: PhotoFile) =>
    api.postForm('/ambulance-staff/profile-photo', photoFormData('profilePhoto', file)),
  setDuty: (onDuty: boolean, offDutyReasonId?: string) =>
    api.post('/ambulance-staff/duty', { onDuty, isDutyOn: onDuty, offDutyReasonId }),
  updateLocation: (lat: number, lng: number) =>
    api.post('/ambulance-staff/location', { lat, lng }).catch(() => undefined),

  activeDispatch: () => api.get('/ambulance-staff/dispatches/active'),
  dispatchHistory: () =>
    api.get<any>('/ambulance-staff/dispatches/history').then((d) =>
      Array.isArray(d) ? d : d?.items ?? [],
    ),

  // Emergency-dispatch lifecycle actions (driver-role staff act on /dispatches/:id/*).
  acceptDispatch: (id: string) => api.post(`/dispatches/${id}/accept`, {}),
  rejectDispatch: (id: string, reason?: string) => api.post(`/dispatches/${id}/reject`, { reason }),
  enRoute: (id: string) => api.post(`/dispatches/${id}/en-route`, {}),
  onScene: (id: string) => api.post(`/dispatches/${id}/on-scene`, {}),
  startDispatch: (id: string, otp?: string) => api.post(`/dispatches/${id}/start`, { otp }),
  dispatchDestination: (id: string, dest: { name?: string; address?: string; lat?: number; lng?: number }) =>
    api.post(`/dispatches/${id}/destination`, dest),
  completeDispatch: (id: string) => api.post(`/dispatches/${id}/complete`, {}),

  // Patient AmbulanceRequest dispatch actions (SOS / Book-Ambulance loop).
  activeRequest: () => api.get('/ambulance-staff/requests/active'),
  requestAccept: (id: string) => api.post(`/ambulance-staff/requests/${id}/accept`, {}),
  requestReject: (id: string) => api.post(`/ambulance-staff/requests/${id}/reject`, {}),
  requestEnRoute: (id: string) => api.post(`/ambulance-staff/requests/${id}/en-route`, {}),
  requestArrived: (id: string) => api.post(`/ambulance-staff/requests/${id}/arrived`, {}),
  requestStart: (id: string, otp?: string) => api.post(`/ambulance-staff/requests/${id}/start`, { otp }),
  requestComplete: (id: string) => api.post(`/ambulance-staff/requests/${id}/complete`, {}),
  requestDestination: (id: string, dest: { address?: string; lat?: number; lng?: number }) =>
    api.post(`/ambulance-staff/requests/${id}/destination`, dest),

  shifts: () =>
    api.get<any>('/ambulance-staff/shifts').then((d) =>
      Array.isArray(d) ? d : d?.items ?? [],
    ),
  clockIn: (shiftId: string) => api.post(`/ambulance-staff/shifts/${shiftId}/clock-in`, {}),
  clockOut: (shiftId: string) => api.post(`/ambulance-staff/shifts/${shiftId}/clock-out`, {}),

  earnings: () => api.get<any>('/ambulance-staff/earnings'),
  offDutyReasons: () =>
    api.get<any>('/ambulance-staff/off-duty-reasons').then((d) =>
      Array.isArray(d) ? d : d?.items ?? d?.reasons ?? [],
    ),
  notifications: () =>
    api.get<any>('/ambulance-staff/notifications').then((d) => ({
      items: Array.isArray(d) ? d : d?.items ?? d?.notifications ?? [],
      unread: d?.unreadCount ?? 0,
    })),
  markAllRead: () => api.post('/ambulance-staff/notifications/read-all', {}).catch(() => undefined),

  // ---- Patient / case / leave / stock (see backend ambulance-staff app routes) ----
  leaves: () => api.get<any>('/ambulance-staff/leaves').then((d) => (Array.isArray(d) ? d : d?.items ?? [])),
  applyLeave: (
    data: { type: string; from: string; to: string; day: string; reason?: string },
    file?: PhotoFile,
  ) => {
    // With an attachment we must send multipart; otherwise a plain JSON POST.
    if (file) {
      const form = new FormData();
      form.append('type', data.type);
      form.append('from', data.from);
      form.append('to', data.to);
      form.append('day', data.day);
      if (data.reason) form.append('reason', data.reason);
      form.append('attachment', file as any);
      return api.postForm('/ambulance-staff/leaves', form);
    }
    return api.post('/ambulance-staff/leaves', data);
  },
  patients: () => api.get<any>('/ambulance-staff/patients').then((d) => (Array.isArray(d) ? d : d?.items ?? [])),
  addPatient: (data: { name: string; mobile?: string; dob?: string; gender?: string; pincode?: string }) =>
    api.post('/ambulance-staff/patients', data),
  saveCaseNotes: (data: { dispatchId?: string; patientId?: string; vitals?: any; notes?: string }) =>
    api.post('/ambulance-staff/case-notes', data),
  stockRequest: (items: { name: string; qty: number }[]) =>
    api.post('/ambulance-staff/stock-requests', { items }),
};
