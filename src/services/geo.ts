export interface LatLng {
  lat: number;
  lng: number;
}

/** Straight-line (haversine) distance in km between two points. */
export const distanceKm = (a?: LatLng | null, b?: LatLng | null): number | null => {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
    return null;
  }
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
};

/** Rough ETA (minutes) from a distance, assuming ~30 km/h urban average. */
export const etaMinutesFromKm = (km?: number | null): number | null => {
  if (km == null) return null;
  return Math.max(1, Math.round((km / 30) * 60));
};
