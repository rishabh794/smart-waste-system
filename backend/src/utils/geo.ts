/**
 * Geofencing utilities for location-based proximity validation.
 *
 * Uses the Haversine formula to compute great-circle distances between
 * two GPS coordinates on Earth's surface.
 */

/** Driver must be within this radius (meters) to update a bin status. */
export const DRIVER_GEOFENCE_RADIUS_M = 140;

/** Citizen reports auto-link to the nearest bin within this radius (meters). */
export const CITIZEN_NEARBY_RADIUS_M = 120;

const EARTH_RADIUS_M = 6_371_000; // Mean Earth radius in meters

/**
 * Compute the great-circle distance in **meters** between two lat/lng points
 * using the Haversine formula.
 */
export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Compute a lat/lng bounding box for a given radius around a center point.
 *
 * This is used as a cheap pre-filter before running exact Haversine calculations,
 * so we only scan nearby rows rather than the entire bins table.
 */
export const boundingBox = (
  latitude: number,
  longitude: number,
  radiusM: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } => {
  // 1 degree latitude ≈ 111,320 meters
  const latDelta = radiusM / 111_320;
  // 1 degree longitude shrinks with cos(lat)
  const lonDelta = radiusM / (111_320 * Math.cos((latitude * Math.PI) / 180));

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta,
  };
};
