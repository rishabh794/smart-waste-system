"use client";

import { useEffect, useState } from "react";
import { apiFetch } from '../../lib/apiFetch';
import dynamic from 'next/dynamic';
import polyline from '@mapbox/polyline';
import { toast } from "sonner";
import useSWR from 'swr';

interface RouteBin {
  binId: string;
  sequence: number;
  zone: string;
  status: string;
  latitude: number;
  longitude: number;
  optimizedSequence?: number;
}

interface RouteData {
  routeId: string;
  bins: RouteBin[];
}

interface OptimizedRouteState {
  bins: RouteBin[];
  routePath: [number, number][];
}

//Open Source Routing Machine (OSRM) expects coordinates in [lng, lat] format, but Leaflet uses [lat, lng].
interface OsrmWaypoint {
  waypoint_index: number;
}

interface OsrmTripResponse {
  code: string;
  trips?: Array<{ geometry: string }>;
  waypoints?: OsrmWaypoint[];
}

const DriverMap = dynamic(() => import('./DriverMap'), { 
  ssr: false, 
  loading: () => <div className="h-100 w-full soft-surface mb-4 flex items-center justify-center text-[#557064]">Loading GPS Uplink...</div>
});

const DEPOT_COORDS: [number, number] = [30.316, 78.032];
const routeGeometryCache = new Map<string, OptimizedRouteState>();

const getApiErrorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  } catch {
    // Fall through to fallback message when response body is not JSON.
  }

  return fallback;
};

const sortBinsBySequence = (bins: RouteBin[]) => {
  return [...bins].sort(
    (a, b) =>
      (a.optimizedSequence ?? a.sequence) - (b.optimizedSequence ?? b.sequence)
  );
};

const mergeCachedOrder = (bins: RouteBin[], referenceBins: RouteBin[]) => {
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

const fetchDriverRoute = async (url: string): Promise<RouteData | null> => {
  // API call: fetch the driver's current route from backend.
  const res = await apiFetch(url);

  if (!res.ok) {
    throw new Error(await getApiErrorMessage(res, 'Unable to fetch driver route.'));
  }

  const payload = (await res.json()) as Partial<RouteData> & { message?: string };

  if (!payload.routeId) {
    return null;
  }

  return {
    routeId: payload.routeId,
    bins: Array.isArray(payload.bins) ? payload.bins : [],
  };
};

const optimizeRouteGeometry = async (routeData: RouteData): Promise<OptimizedRouteState> => {
  const depotStr = `${DEPOT_COORDS[1]},${DEPOT_COORDS[0]}`;
  const routableBins = routeData.bins.filter((bin) => bin.longitude && bin.latitude);
  const binStrs = routableBins.map((bin) => `${bin.longitude},${bin.latitude}`).join(';');

  if (!binStrs) {
    return {
      bins: sortBinsBySequence(routeData.bins),
      routePath: [],
    };
  }

  try {
    const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${depotStr};${binStrs}?roundtrip=true&source=first&geometries=polyline`;
    // OSRM call: get optimized stop order and polyline.
    const osrmRes = await fetch(osrmUrl);
    const osrmData = (await osrmRes.json()) as OsrmTripResponse;

    if (osrmData.code === 'Ok' && osrmData.trips?.[0]) {
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
      };
    }
  } catch (error) {
    console.error('OSRM routing error:', error);
  }

  return {
    bins: sortBinsBySequence(routeData.bins),
    routePath: [],
  };
};

export default function DriverDashboard({ userId }: { userId: string }) {
  // SWR key scoped to the current driver session.
  const routeKey = userId ? `/api/routes/driver/${userId}` : null;

  // SWR keeps route data globally cached to avoid over-fetching.
  const {
    data: cachedRoute,
    error: routeError,
    isLoading,
    isValidating,
    mutate: mutateDriverRoute,
  } = useSWR<RouteData | null>(routeKey, fetchDriverRoute, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60_000,
  });

  // Important UI state: currently active route rendered in the dashboard.
  const [displayRoute, setDisplayRoute] = useState<RouteData | null>(null);
  // Important map state: current optimized route polyline.
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  // Preserve last known map payload to avoid map teardown flashes.
  const [preservedMap, setPreservedMap] = useState<OptimizedRouteState | null>(null);
  // Important request state: lock duplicate bin-status updates.
  const [binStatusUpdate, setBinStatusUpdate] = useState<{ binId: string; status: string } | null>(null);
  const [isConfirmingComplete, setIsConfirmingComplete] = useState(false);
  // Important request state: prevent duplicate complete-route API calls.
  const [isCompletingRoute, setIsCompletingRoute] = useState(false);

  // useEffect: sync SWR route data with cached OSRM geometry and map state.
  useEffect(() => {
    let isCancelled = false;

    const synchronizeRouteView = async () => {
      if (!cachedRoute?.routeId) {
        if (!isValidating) {
          setDisplayRoute(null);
          setRoutePath([]);
        }
        return;
      }

      const cachedGeometry = routeGeometryCache.get(cachedRoute.routeId);
      if (cachedGeometry) {
        const orderedBins = mergeCachedOrder(cachedRoute.bins, cachedGeometry.bins);
        if (isCancelled) return;

        setDisplayRoute({ ...cachedRoute, bins: orderedBins });
        setRoutePath(cachedGeometry.routePath);
        setPreservedMap({ bins: orderedBins, routePath: cachedGeometry.routePath });
        return;
      }

      const fallbackBins = sortBinsBySequence(cachedRoute.bins);
      if (!isCancelled) {
        setDisplayRoute({ ...cachedRoute, bins: fallbackBins });
        setRoutePath([]);
      }

      const optimizedRoute = await optimizeRouteGeometry(cachedRoute);
      if (isCancelled) return;

      routeGeometryCache.set(cachedRoute.routeId, optimizedRoute);
      setDisplayRoute({ ...cachedRoute, bins: optimizedRoute.bins });
      setRoutePath(optimizedRoute.routePath);
      setPreservedMap(optimizedRoute);
    };

    void synchronizeRouteView();

    return () => {
      isCancelled = true;
    };
  }, [cachedRoute, isValidating]);

  // useEffect: reset completion confirmation whenever route context changes.
  useEffect(() => {
    setIsConfirmingComplete(false);
  }, [displayRoute?.routeId]);

  const updateBinStatus = async (binId: string, newStatus: string) => {
    if (!displayRoute?.routeId || binStatusUpdate) return;

    const activeRouteId = displayRoute.routeId;
    const previousRouteSnapshot = cachedRoute ?? null;

    setBinStatusUpdate({ binId, status: newStatus });

    // SWR optimistic cache update for instant UI feedback.
    await mutateDriverRoute(
      (currentRoute) => {
        if (!currentRoute || currentRoute.routeId !== activeRouteId) {
          return currentRoute;
        }

        return {
          ...currentRoute,
          bins: currentRoute.bins.map((bin) =>
            bin.binId === binId ? { ...bin, status: newStatus } : bin
          ),
        };
      },
      { revalidate: false, populateCache: true }
    );

    try {
      // API call: persist bin status update.
      const res = await apiFetch(`/api/routes/${activeRouteId}/bins/${binId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
            });

      if (!res.ok) {
        await mutateDriverRoute(previousRouteSnapshot, { revalidate: false, populateCache: true });
        toast.error(await getApiErrorMessage(res, 'Unable to update bin status.'));
      }
    } catch (error) {
      await mutateDriverRoute(previousRouteSnapshot, { revalidate: false, populateCache: true });
      console.error("Network error:", error);
      toast.error("Network issue while updating bin status. Please try again.");
    } finally {
      setBinStatusUpdate(null);
    }
  };

  const handleCompleteRoute = async () => {
    if (!displayRoute?.routeId || isCompletingRoute) return;

    const activeRouteId = displayRoute.routeId;

    try {
      setIsCompletingRoute(true);
      // API call: mark the active route as completed.
      const res = await apiFetch(`/api/routes/${activeRouteId}/status`, { method: "PATCH" });
      
      if (res.ok) {
        toast.success("Route marked as completed.");
        setIsConfirmingComplete(false);
        // SWR cache update: remove completed route without refetch.
        await mutateDriverRoute(
          (currentRoute) => {
            if (!currentRoute || currentRoute.routeId !== activeRouteId) {
              return currentRoute;
            }
            return null;
          },
          { revalidate: false, populateCache: true }
        );
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to complete route right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while completing route. Please try again.");
    } finally {
      setIsCompletingRoute(false);
    }
  };

  if (isLoading && !displayRoute && !preservedMap) {
    return (
      <div className="soft-surface mt-4 p-8 text-center">
        <p className="text-sm font-black tracking-[0.16em] text-[#1a7b3a]">LOADING ROUTE</p>
        <p className="mt-2 text-lg font-bold text-[#1f412f]">Syncing today&apos;s route...</p>
      </div>
    );
  }

  if (!displayRoute || !displayRoute.routeId) {
    const visibleMapBins = preservedMap?.bins ?? [];
    const visibleMapPath = preservedMap?.routePath ?? [];

    return (
      <div className="space-y-4">
        {preservedMap && (
          <div className="relative">
            <DriverMap bins={visibleMapBins} routePolyline={visibleMapPath} depotCoords={DEPOT_COORDS} />
            <div className="pointer-events-none absolute inset-0 flex items-start justify-end rounded-xl bg-[#f8fcf9]/55 p-3">
              <span className="rounded-full border border-[#d6e6dc] bg-[#ffffffcf] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#2f4c3b]">
                Route cache preserved
              </span>
            </div>
          </div>
        )}

        {routeError && (
          <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
            {routeError instanceof Error ? routeError.message : 'Unable to refresh route right now.'}
          </div>
        )}

        <div className="soft-surface mt-4 p-8 text-center">
          <p className="text-sm font-black tracking-[0.16em] text-[#1a7b3a]">NO ACTIVE ROUTE</p>
          <p className="mt-2 text-lg font-bold text-[#1f412f]">No active routes. Enjoy the day off!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#e6efe9] pb-4">
        <h2 className="text-2xl font-extrabold text-[#1f412f]">Driver Interface</h2>
        <p className="mt-1 text-sm text-[#607267]">Track your assigned stops and update collection outcomes.</p>
      </div>

      <DriverMap bins={displayRoute.bins} routePolyline={routePath} depotCoords={DEPOT_COORDS} />

      <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
        <h3 className="px-4 pt-4 text-lg font-extrabold text-[#1f412f]">
          Today Route (ID: {displayRoute.routeId ? displayRoute.routeId.substring(0,8) + '...' : 'None'})
        </h3>
        
        {displayRoute.bins?.length > 0 ? (
          <>
            <ul className="mb-4 divide-y divide-[#edf3ee] border-y border-[#edf3ee]">
              {displayRoute.bins.map((bin) => (
                <li key={bin.binId} className="flex flex-col px-4 py-4 odd:bg-[#fcfffd] even:bg-[#f6fbf8]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#244734]">Stop {bin.sequence}: Bin #{bin.binId.substring(0,5)} ({bin.zone})</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-extrabold uppercase ${
                      bin.status === 'collected' ? 'bg-green-100 text-green-700' : 
                      bin.status === 'overflowing' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {bin.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateBinStatus(bin.binId, 'collected')}
                      disabled={Boolean(binStatusUpdate)}
                      className="w-1/2 rounded-md border border-[#cfdacb] bg-[#eef5ea] px-3 py-2 text-sm font-bold text-[#17311f] transition hover:border-[#1a7b3a] hover:bg-[#dff0d8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {binStatusUpdate?.binId === bin.binId && binStatusUpdate.status === "collected" ? "Updating..." : "Collected"}
                    </button>
                    <button 
                      onClick={() => updateBinStatus(bin.binId, 'overflowing')}
                      disabled={Boolean(binStatusUpdate)}
                      className="w-1/2 rounded-md border border-[#e8c4c4] bg-[#fff5f5] px-3 py-2 text-sm font-bold text-[#7d2222] transition hover:bg-[#ffe8e8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {binStatusUpdate?.binId === bin.binId && binStatusUpdate.status === "overflowing" ? "Updating..." : "Overflowing"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {!isConfirmingComplete ? (
              <button
                onClick={() => setIsConfirmingComplete(true)}
                className="btn-primary mx-4 mb-4 mt-2 w-[calc(100%-2rem)]"
              >
                Finish Day Route
              </button>
            ) : (
              <div className="mx-4 mb-4 mt-2 rounded-xl border border-[#f1d8b1] bg-[#fff7e9] p-4">
                <p className="text-sm font-bold text-[#5a4213]">
                  Confirm route completion?
                </p>
                <p className="mt-1 text-sm text-[#6d5730]">
                  This will mark today&apos;s route as complete for dispatch records.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingComplete(false)}
                    disabled={isCompletingRoute}
                    className="w-1/2 rounded-md border border-[#d4c2a0] bg-[#fffdfa] px-3 py-2 text-sm font-semibold text-[#5e4a23] transition hover:bg-[#fff4df] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteRoute}
                    disabled={isCompletingRoute}
                    className="w-1/2 rounded-md border border-[#e5b567] bg-[#f2c06f] px-3 py-2 text-sm font-extrabold text-[#4f3810] transition hover:bg-[#f5cb86] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCompletingRoute ? "Completing..." : "Yes, Complete Route"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mb-4 rounded-md border border-[#c8e6ce] bg-[#eefaf0] p-3 font-bold text-[#2c6f39]">No bins assigned today. Enjoy the day off!</p>
        )}
      </div>
    </div>
  );
}