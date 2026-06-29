import { api } from './client';

export interface Centre {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  type?: string;
  location?: { coordinates?: [number, number] }; // [lng, lat]
  distanceKm?: number;
  lat?: number;
  lng?: number;
  matchCount?: number;
  recommended?: boolean;
}

/** Public centres/hospitals directory — used by the crew to pick a drop-off. */
export const centresApi = {
  nearby: (lat: number, lng: number) =>
    api
      .get<any>('/centres', { lat, lng, maxDistance: 50000 }, false)
      .then((d) => (Array.isArray(d) ? d : d?.items ?? d?.centres ?? []) as Centre[]),
  // Best-hospital suggestion by case type (recommended flag on the top match).
  suggest: (lat: number, lng: number, caseType?: string) =>
    api
      .get<any>('/centres/suggest', { lat, lng, caseType }, false)
      .then((d) => (d?.items ?? []) as Centre[]),
};
