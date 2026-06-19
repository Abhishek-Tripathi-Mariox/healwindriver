import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { storage } from '../api/storage';

/**
 * Real-time Socket.io client (driver + ambulance-staff). The backend
 * authenticates via handshake.auth.token and auto-joins `user:<id>`, then
 * pushes dispatch/booking events to that room. We connect after login and
 * disconnect on logout; the realtime layer subscribes to events.
 */

let socket: Socket | null = null;

export const socketService = {
  get raw() {
    return socket;
  },
  get connected() {
    return !!socket?.connected;
  },

  async connect() {
    const token = await storage.getToken();
    if (!token) return;
    if (socket?.connected) return;
    socket?.disconnect();
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
    });
  },

  disconnect() {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  },

  /** Subscribe to a server event; returns an unsubscribe fn. */
  on(event: string, cb: (data: any) => void): () => void {
    socket?.on(event, cb);
    return () => socket?.off(event, cb);
  },

  emit(event: string, data?: any) {
    socket?.emit(event, data);
  },
};
