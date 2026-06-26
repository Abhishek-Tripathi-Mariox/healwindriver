import { api } from './client';
import { roleStore } from '../state/roleStore';

/**
 * Support tickets for the in-app roles. The endpoint differs by role — drivers
 * hit /driver/tickets, ambulance staff hit /ambulance-staff/tickets — but the
 * shape is identical, so the screens stay role-agnostic.
 */
const base = () => (roleStore.get() === 'staff' ? '/ambulance-staff/tickets' : '/driver/tickets');

const toList = (d: any) => (Array.isArray(d) ? d : d?.tickets ?? []);

export const supportApi = {
  tickets: () => api.get<any>(base()).then(toList),
  ticket: (id: string) => api.get<{ ticket: any; messages: any[] }>(`${base()}/${id}`),
  createTicket: (data: { category: string; subject: string; message: string; bookingId?: string }) =>
    api.post(base(), data),
  addMessage: (id: string, message: string) => api.post(`${base()}/${id}/messages`, { message }),
  closeTicket: (id: string) => api.post(`${base()}/${id}/close`, {}),
};
