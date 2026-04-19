"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import useSWR from 'swr';
import DataLoadingState from "@/components/ui/DataLoadingState";
import DriverNoRouteMessage from "@/components/driver/sections/DriverNoRouteMessage";
import DriverRoutePanel from "@/components/driver/sections/DriverRoutePanel";
import { getApiErrorMessage } from "@/lib/services/apiService";
import {
  cacheRouteGeometry,
  completeDriverRoute,
  DEPOT_COORDS,
  DRIVER_ROUTE_DEDUPING_INTERVAL_MS,
  fetchDriverRoute,
  getCachedRouteGeometry,
  getDriverRouteKey,
  mergeCachedOrder,
  optimizeRouteGeometry,
  sortBinsBySequence,
  updateDriverBinStatus,
} from "@/lib/services/driverService";
import type {
  BinStatusUpdate,
  OptimizedRouteState,
  RouteData,
} from "@/types/DriverTypes";

const DriverMap = dynamic(() => import('./DriverMap'), { 
  ssr: false, 
  loading: () => <div className="h-100 w-full soft-surface mb-4 flex items-center justify-center text-[#557064]">Loading GPS Uplink...</div>
});

export default function DriverDashboard({ userId }: { userId: string }) {
  // SWR key scoped to the current driver session.
  const routeKey = getDriverRouteKey(userId);

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
    dedupingInterval: DRIVER_ROUTE_DEDUPING_INTERVAL_MS,
  });

  // Important UI state: currently active route rendered in the dashboard.
  const [displayRoute, setDisplayRoute] = useState<RouteData | null>(null);
  // Important map state: current optimized route polyline.
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  // Preserve last known map payload to avoid map teardown flashes.
  const [preservedMap, setPreservedMap] = useState<OptimizedRouteState | null>(null);
  // Important request state: lock duplicate bin-status updates.
  const [binStatusUpdate, setBinStatusUpdate] = useState<BinStatusUpdate | null>(null);
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

      const cachedGeometry = getCachedRouteGeometry(cachedRoute.routeId);
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

      cacheRouteGeometry(cachedRoute.routeId, optimizedRoute);
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
      const res = await updateDriverBinStatus(activeRouteId, binId, newStatus);

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
      const res = await completeDriverRoute(activeRouteId);
      
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
      <DataLoadingState
        title="Loading route"
        subtitle="Syncing your assigned stops and route map."
        className="mt-4"
      />
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

        <DriverNoRouteMessage routeError={routeError} />
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

      <DriverRoutePanel
        displayRoute={displayRoute}
        binStatusUpdate={binStatusUpdate}
        isConfirmingComplete={isConfirmingComplete}
        isCompletingRoute={isCompletingRoute}
        onSetConfirmingComplete={setIsConfirmingComplete}
        onUpdateBinStatus={updateBinStatus}
        onCompleteRoute={handleCompleteRoute}
      />
    </div>
  );
}
