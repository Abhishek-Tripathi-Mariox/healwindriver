import { api } from './client';
import { photoFormData, type PhotoFile } from './upload';

/** Fields a driver may edit on their own profile (backend: PUT /driver/profile). */
export interface DriverProfileUpdate {
  fullName?: string;
  email?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
}

/** Driver-facing endpoints (/driver/*). */
export const driverApi = {
  profile: () => api.get('/driver/profile'),
  updateProfile: (data: DriverProfileUpdate) => api.put('/driver/profile', data),
  // Backend expects the file under the field name "photo".
  updateProfilePhoto: (file: PhotoFile) =>
    api.putForm('/driver/profile/photo', photoFormData('photo', file)),
  toggleStatus: (isOnline?: boolean) =>
    api.post('/driver/status/toggle', isOnline === undefined ? {} : { isOnline }),
  updateLocation: (lat: number, lng: number) =>
    api.post('/driver/location', { lat, lng }).catch(() => undefined),

  currentBooking: () => api.get('/driver/bookings/current'),
  bookingHistory: () =>
    api.get<any>('/driver/bookings/history').then((d) =>
      Array.isArray(d) ? d : d?.items ?? d?.bookings ?? [],
    ),

  earnings: (range: 'week' | 'month' = 'week') => api.get('/driver/earnings', { range }),
  earningsHistory: () =>
    api.get<any>('/driver/earnings/history').then((d) =>
      Array.isArray(d) ? d : d?.items ?? d?.bookings ?? [],
    ),

  notifications: () =>
    api.get<any>('/driver/notifications').then((d) => ({
      items: Array.isArray(d) ? d : d?.items ?? d?.notifications ?? [],
      unread: d?.unreadCount ?? 0,
    })),
  markNotificationRead: (id: string) =>
    api.post(`/driver/notifications/${id}/read`, {}).catch(() => undefined),

  // Booking/dispatch lifecycle actions.
  accept: (bookingId: string) => api.post(`/driver/bookings/${bookingId}/accept`, {}),
  reject: (bookingId: string, reason?: string) =>
    api.post(`/driver/bookings/${bookingId}/reject`, { reason }),
  arrived: (bookingId: string) => api.post(`/driver/bookings/${bookingId}/arrived`, {}),
  start: (bookingId: string) => api.post(`/driver/bookings/${bookingId}/start`, {}),
  complete: (bookingId: string) => api.post(`/driver/bookings/${bookingId}/complete`, {}),
};
