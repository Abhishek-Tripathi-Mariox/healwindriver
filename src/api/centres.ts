import { api } from './client';

export interface Centre {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  type?: string;
  location?: { coordinates?: [number, number] }; // [lng, lat]
  distanceKm?: number;
}

/** Public centres/hospitals directory — used by the crew to pick a drop-off. */
export const centresApi = {
  nearby: (lat: number, lng: number) =>
    api
      .get<any>('/centres', { lat, lng, maxDistance: 50000 }, false)
      .then((d) => (Array.isArray(d) ? d : d?.items ?? d?.centres ?? []) as Centre[]),
};
