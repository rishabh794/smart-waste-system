import polyline from "@mapbox/polyline";
import { apiFetch } from "@/lib/apiFetch";
import { isEffectivelyOnline, isNetworkError } from "@/lib/offline/network";
import {
  getRouteGeometrySnapshot,
  getRouteSnapshot,
  saveRouteSnapshot,
} from "@/lib/offline/queue";
import { getApiErrorMessage } from "@/lib/services/apiService";
import type {
  DriverBinStatus,
  MissedReasonCode,
  OptimizedRouteState,
  RouteBin,
  RouteData,
} from "@/types/DriverTypes";

interface OsrmWaypoint {
  waypoint_index: number;
}

interface OsrmTripResponse {
  code: string;
  trips?: Array<{ geometry: string }>;
  waypoints?: OsrmWaypoint[];
}

export const DEPOT_COORDS: [number, number] = [30.316, 78.032];
export const DRIVER_ROUTE_DEDUPING_INTERVAL_MS = 60_000;
const routeGeometryCache = new Map<string, OptimizedRouteState>();

export const getDriverRouteKey = (userId: string) => (userId ? `/api/routes/driver/${userId}` : null);

const getUserIdFromRouteKey = (url: string) => url.split("/").pop() ?? "";

export const getCachedRouteGeometry = (routeId: string) => routeGeometryCache.get(routeId);

export const cacheRouteGeometry = (routeId: string, optimizedRoute: OptimizedRouteState) => {
  routeGeometryCache.set(routeId, optimizedRoute);
};

export const hydrateRouteGeometryFromSnapshot = async (routeId: string) => {
  if (routeGeometryCache.has(routeId)) {
    return routeGeometryCache.get(routeId) ?? null;
  }

  const snapshotGeometry = await getRouteGeometrySnapshot(routeId);
  if (snapshotGeometry) {
    routeGeometryCache.set(routeId, snapshotGeometry);
    return snapshotGeometry;
  }

  return null;
};

export const sortBinsBySequence = (bins: RouteBin[]) => {
  return [...bins].sort(
    (a, b) => (a.optimizedSequence ?? a.sequence) - (b.optimizedSequence ?? b.sequence)
  );
};

export const mergeCachedOrder = (bins: RouteBin[], referenceBins: RouteBin[]) => {
  const optimizedSequenceByBinId = new Map(
    referenceBins.map((bin) => [bin.binId, bin.optimizedSequence ?? bin.sequence])
  );

  return sortBinsBySequence(
    bins.map((bin) => ({
      ...bin,
      optimizedSequence:
        optimizedSequenceByBinId.get(bin.binId) ?? bin.optimizedSequence ?? bin.sequence,
    }))
  );
};

export const fetchDriverRoute = async (url: string): Promise<RouteData | null> => {
  const userId = getUserIdFromRouteKey(url);
  const online = await isEffectivelyOnline();

  if (!online) {
    const cached = await getRouteSnapshot(userId);
    if (cached?.route) {
      return cached.route;
    }
    throw new Error("Offline — no cached route available.");
  }

  try {
    const res = await apiFetch(url);

    if (!res.ok) {
      throw new Error(await getApiErrorMessage(res, "Unable to fetch driver route."));
    }

    const payload = (await res.json()) as Partial<RouteData> & { message?: string };

    if (!payload.routeId) {
      await saveRouteSnapshot({
        userId,
        route: null,
        geometry: null,
        cachedAt: Date.now(),
      });
      return null;
    }

    const route: RouteData = {
      routeId: payload.routeId,
      depotLat: payload.depotLat,
      depotLng: payload.depotLng,
      bins: Array.isArray(payload.bins) ? payload.bins : [],
    };

    const geometry = routeGeometryCache.get(route.routeId) ?? (await getRouteGeometrySnapshot(route.routeId));
    await saveRouteSnapshot({
      userId,
      route,
      geometry,
      cachedAt: Date.now(),
    });

    return route;
  } catch (error) {
    if (!(await isEffectivelyOnline()) || isNetworkError(error)) {
      const cached = await getRouteSnapshot(userId);
      if (cached?.route) {
        return cached.route;
      }
    }

    throw error;
  }
};

export const optimizeRouteGeometry = async (
  routeData: RouteData
): Promise<OptimizedRouteState> => {
  const depotLat = routeData.depotLat ?? DEPOT_COORDS[0];
  const depotLng = routeData.depotLng ?? DEPOT_COORDS[1];
  const depotStr = `${depotLng},${depotLat}`;
  const routableBins = routeData.bins.filter((bin) => bin.longitude && bin.latitude);
  const binCoordinates = routableBins.map((bin) => `${bin.longitude},${bin.latitude}`).join(";");

  if (!binCoordinates) {
    return {
      bins: sortBinsBySequence(routeData.bins),
      routePath: [],
      depotLat,
      depotLng,
    };
  }

  if (!(await isEffectivelyOnline())) {
    const cachedGeometry = await hydrateRouteGeometryFromSnapshot(routeData.routeId);
    if (cachedGeometry) {
      return cachedGeometry;
    }

    return {
      bins: sortBinsBySequence(routeData.bins),
      routePath: [],
      depotLat,
      depotLng,
    };
  }

  try {
    const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${depotStr};${binCoordinates}?roundtrip=true&source=first&geometries=polyline`;
    const osrmRes = await fetch(osrmUrl);
    const osrmData = (await osrmRes.json()) as OsrmTripResponse;

    if (osrmData.code === "Ok" && osrmData.trips?.[0]) {
      const decodedPath = polyline.decode(osrmData.trips[0].geometry) as [number, number][];

      const waypointSequenceByBinId = new Map<string, number>();
      routableBins.forEach((bin, index) => {
        const waypoint = osrmData.waypoints?.[index + 1];
        if (waypoint) {
          waypointSequenceByBinId.set(bin.binId, waypoint.waypoint_index);
        }
      });

      const optimizedBins = routeData.bins.map((bin) => ({
        ...bin,
        optimizedSequence: waypointSequenceByBinId.get(bin.binId) ?? bin.sequence,
      }));

      return {
        bins: sortBinsBySequence(optimizedBins),
        routePath: decodedPath,
        depotLat,
        depotLng,
      };
    }
  } catch (error) {
    console.error("OSRM routing error:", error);
  }

  return {
    bins: sortBinsBySequence(routeData.bins),
    routePath: [],
    depotLat,
    depotLng,
  };
};

export const persistRouteGeometrySnapshot = async (
  userId: string,
  route: RouteData,
  geometry: OptimizedRouteState
) => {
  cacheRouteGeometry(route.routeId, geometry);
  await saveRouteSnapshot({
    userId,
    route,
    geometry,
    cachedAt: Date.now(),
  });
};

export const updateDriverBinStatus = (
  routeId: string,
  binId: string,
  status: DriverBinStatus,
  driverLatitude: number,
  driverLongitude: number,
  options?: {
    wasOverflowing?: boolean;
    missedReasonCode?: MissedReasonCode;
    missedNote?: string;
  }
) => {
  const payload = {
    status,
    driverLatitude,
    driverLongitude,
    ...(typeof options?.wasOverflowing === "boolean" ? { wasOverflowing: options.wasOverflowing } : {}),
    ...(options?.missedReasonCode ? { missedReasonCode: options.missedReasonCode } : {}),
    ...(options?.missedNote ? { missedNote: options.missedNote } : {}),
  };

  return apiFetch(`/api/routes/${routeId}/bins/${binId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const completeDriverRoute = (routeId: string) => {
  return apiFetch(`/api/routes/${routeId}/status`, { method: "PATCH" });
};
