"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import useSWR from 'swr';
import DataLoadingState from "@/components/ui/DataLoadingState";
import DriverNoRouteMessage from "@/components/driver/sections/DriverNoRouteMessage";
import DriverRoutePanel from "@/components/driver/sections/DriverRoutePanel";
import { useNetworkStatus } from "@/components/offline/NetworkStatusProvider";
import { useDriverLocation } from "@/lib/hooks/useDriverLocation";
import { OFFLINE_SYNC_COMPLETE_EVENT } from "@/lib/offline/events";
import { isNetworkError } from "@/lib/offline/network";
import { enqueueBinStatus, enqueueRouteComplete } from "@/lib/offline/queue";
import { getApiErrorMessage } from "@/lib/services/apiService";
import {
  completeDriverRoute,
  DEPOT_COORDS,
  DRIVER_ROUTE_DEDUPING_INTERVAL_MS,
  fetchDriverRoute,
  getCachedRouteGeometry,
  getDriverRouteKey,
  hydrateRouteGeometryFromSnapshot,
  mergeCachedOrder,
  optimizeRouteGeometry,
  persistRouteGeometrySnapshot,
  sortBinsBySequence,
  updateDriverBinStatus,
} from "@/lib/services/driverService";
import type {
  BinStatusUpdate,
  DriverBinStatus,
  MissedReasonCode,
  OptimizedRouteState,
  RouteData,
} from "@/types/DriverTypes";

/**
 * @see DRIVER_GEOFENCE_RADIUS_M in backend/src/utils/geo.ts
 */
const DRIVER_GEOFENCE_RADIUS_M = 200;

const resolveDepotCoords = (depotLat?: number, depotLng?: number): [number, number] =>
  depotLat != null && depotLng != null ? [depotLat, depotLng] : DEPOT_COORDS;

/**
 * @see haversineDistance in backend/src/utils/geo.ts
 */
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const arePathsEqual = (a: [number, number][], b: [number, number][]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
};

/** Promise wrapper around navigator.geolocation for async/await usage. */
const DriverMap = dynamic(() => import('./DriverMap'), {
  ssr: false,
  loading: () => <div className="h-100 w-full soft-surface mb-4 flex items-center justify-center text-[#557064]">Loading GPS Uplink...</div>
});

export default function DriverDashboard({ userId }: { userId: string }) {
  const { isOnline } = useNetworkStatus();
  const { driverPosition, isTracking, gpsError, getPositionForUpdate } = useDriverLocation();
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
    revalidateOnReconnect: true,
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

  // Refs for shallow-equality guards to avoid unnecessary state updates.
  const routePathRef = useRef<[number, number][]>(routePath);

  // Stable setter: only updates routePath state when the data actually changed.
  const setStableRoutePath = useCallback((nextPath: [number, number][]) => {
    if (!arePathsEqual(routePathRef.current, nextPath)) {
      routePathRef.current = nextPath;
      setRoutePath(nextPath);
    }
  }, []);

  // useEffect: sync SWR route data with cached OSRM geometry and map state.
  useEffect(() => {
    let isCancelled = false;

    const synchronizeRouteView = async () => {
      if (!cachedRoute?.routeId) {
        if (!isValidating) {
          setDisplayRoute(null);
          setStableRoutePath([]);
        }
        return;
      }

      const cachedGeometry =
        getCachedRouteGeometry(cachedRoute.routeId) ??
        (await hydrateRouteGeometryFromSnapshot(cachedRoute.routeId)) ??
        undefined;

      if (cachedGeometry) {
        const orderedBins = mergeCachedOrder(cachedRoute.bins, cachedGeometry.bins);
        if (isCancelled) return;

        setDisplayRoute({ ...cachedRoute, bins: orderedBins });
        setStableRoutePath(cachedGeometry.routePath);
        setPreservedMap({
          bins: orderedBins,
          routePath: cachedGeometry.routePath,
          depotLat: cachedRoute.depotLat ?? cachedGeometry.depotLat,
          depotLng: cachedRoute.depotLng ?? cachedGeometry.depotLng,
        });
        return;
      }

      const fallbackBins = sortBinsBySequence(cachedRoute.bins);
      if (!isCancelled) {
        setDisplayRoute({ ...cachedRoute, bins: fallbackBins });
        setStableRoutePath([]);
      }

      const optimizedRoute = await optimizeRouteGeometry(cachedRoute);
      if (isCancelled) return;

      await persistRouteGeometrySnapshot(userId, cachedRoute, optimizedRoute);
      setDisplayRoute({ ...cachedRoute, bins: optimizedRoute.bins });
      setStableRoutePath(optimizedRoute.routePath);
      setPreservedMap({
        ...optimizedRoute,
        depotLat: cachedRoute.depotLat ?? optimizedRoute.depotLat,
        depotLng: cachedRoute.depotLng ?? optimizedRoute.depotLng,
      });
    };

    void synchronizeRouteView();

    return () => {
      isCancelled = true;
    };
  }, [cachedRoute, isValidating, userId, setStableRoutePath]);

  // useEffect: reset completion confirmation whenever route context changes.
  useEffect(() => {
    setIsConfirmingComplete(false);
  }, [displayRoute?.routeId]);

  useEffect(() => {
    const handleOfflineSyncComplete = () => {
      void mutateDriverRoute();
    };

    window.addEventListener(OFFLINE_SYNC_COMPLETE_EVENT, handleOfflineSyncComplete);
    return () => window.removeEventListener(OFFLINE_SYNC_COMPLETE_EVENT, handleOfflineSyncComplete);
  }, [mutateDriverRoute]);

  const updateBinStatus = async (
    binId: string,
    newStatus: DriverBinStatus,
    options?: {
      wasOverflowing?: boolean;
      missedReasonCode?: MissedReasonCode;
      missedNote?: string;
    }
  ) => {
    if (!displayRoute?.routeId || binStatusUpdate) return;

    const activeRouteId = displayRoute.routeId;
    const previousRouteSnapshot = cachedRoute ?? null;
    const targetBin = displayRoute.bins.find((b) => b.binId === binId);

    setBinStatusUpdate({
      binId,
      status: newStatus,
      wasOverflowing: options?.wasOverflowing,
      missedReasonCode: options?.missedReasonCode,
      missedNote: options?.missedNote,
    });

    try {
      let driverCoords = await getPositionForUpdate();

      if (!driverCoords && newStatus === "missed" && targetBin) {
        driverCoords = {
          latitude: targetBin.latitude,
          longitude: targetBin.longitude,
          capturedAt: Date.now(),
        };
      }

      if (!driverCoords) {
        toast.error(
          gpsError ??
          "GPS signal unavailable. Enable location access and wait for a fix, or mark the stop as skipped."
        );
        return;
      }

      if (newStatus !== "missed" && targetBin) {
        const distM = haversineDistance(
          driverCoords.latitude,
          driverCoords.longitude,
          targetBin.latitude,
          targetBin.longitude
        );
        if (distM > DRIVER_GEOFENCE_RADIUS_M) {
          toast.error(
            `You must be within ${DRIVER_GEOFENCE_RADIUS_M}m of the bin. You are currently ${Math.round(distM)}m away.`
          );
          return;
        }
      }

      const buildUpdatedRoute = (currentRoute: RouteData | null | undefined) => {
        if (!currentRoute || currentRoute.routeId !== activeRouteId) {
          return currentRoute ?? null;
        }

        return {
          ...currentRoute,
          bins: currentRoute.bins.map((bin) =>
            bin.binId === binId
              ? {
                ...bin,
                status: newStatus,
                wasOverflowing: newStatus === "collected" ? Boolean(options?.wasOverflowing) : false,
              }
              : bin
          ),
        };
      };

      let optimisticRoute: RouteData | null = null;

      await mutateDriverRoute(
        (currentRoute) => {
          optimisticRoute = buildUpdatedRoute(currentRoute) ?? null;
          return optimisticRoute;
        },
        { revalidate: false, populateCache: true }
      );

      const persistOptimisticSnapshot = async () => {
        if (!optimisticRoute) return;
        await persistRouteGeometrySnapshot(userId, optimisticRoute, {
          bins: optimisticRoute.bins,
          routePath: routePath.length > 0 ? routePath : (preservedMap?.routePath ?? []),
        });
      };

      const queueOfflineBinUpdate = async () => {
        await enqueueBinStatus({
          userId,
          routeId: activeRouteId,
          binId,
          status: newStatus,
          driverLatitude: driverCoords.latitude,
          driverLongitude: driverCoords.longitude,
          options,
        });
        await persistOptimisticSnapshot();
        toast.info("Update saved offline — will sync when online.");
      };

      if (!isOnline) {
        await queueOfflineBinUpdate();
        return;
      }

      try {
        const res = await updateDriverBinStatus(
          activeRouteId,
          binId,
          newStatus,
          driverCoords.latitude,
          driverCoords.longitude,
          options
        );

        if (!res.ok) {
          await mutateDriverRoute(previousRouteSnapshot, { revalidate: false, populateCache: true });

          if (res.status === 403) {
            const body = await res.json().catch(() => null);
            toast.error(body?.error ?? "You are too far from this bin to update its status.");
          } else {
            toast.error(await getApiErrorMessage(res, "Unable to update bin status."));
          }
          return;
        }

        await persistOptimisticSnapshot();
      } catch (error) {
        if (isNetworkError(error)) {
          await queueOfflineBinUpdate();
          return;
        }

        await mutateDriverRoute(previousRouteSnapshot, { revalidate: false, populateCache: true });
        console.error("Network error:", error);
        toast.error("Network issue while updating bin status. Please try again.");
      }
    } finally {
      setBinStatusUpdate(null);
    }
  };

  const handleCompleteRoute = async () => {
    if (!displayRoute?.routeId || isCompletingRoute) return;

    const activeRouteId = displayRoute.routeId;

    const clearCompletedRoute = async () => {
      setIsConfirmingComplete(false);
      await mutateDriverRoute(
        (currentRoute) => {
          if (!currentRoute || currentRoute.routeId !== activeRouteId) {
            return currentRoute;
          }
          return null;
        },
        { revalidate: false, populateCache: true }
      );
    };

    try {
      setIsCompletingRoute(true);

      if (!isOnline) {
        await enqueueRouteComplete(userId, activeRouteId);
        await clearCompletedRoute();
        toast.info("Route completion saved offline — will sync when online.");
        return;
      }

      const res = await completeDriverRoute(activeRouteId);

      if (res.ok) {
        toast.success("Route marked as completed.");
        await clearCompletedRoute();
        return;
      }

      toast.error(await getApiErrorMessage(res, "Unable to complete route right now."));
    } catch (error) {
      if (!isOnline || isNetworkError(error)) {
        await enqueueRouteComplete(userId, activeRouteId);
        await clearCompletedRoute();
        toast.info("Route completion saved offline — will sync when online.");
        return;
      }

      console.error(error);
      toast.error("Network issue while completing route. Please try again.");
    } finally {
      setIsCompletingRoute(false);
    }
  };

  // Memoize depot coords so the reference is stable across renders.
  // Uses displayRoute when available, falls back to preservedMap.
  const stableDepotCoords = useMemo(
    () => resolveDepotCoords(
      displayRoute?.depotLat ?? preservedMap?.depotLat,
      displayRoute?.depotLng ?? preservedMap?.depotLng
    ),
    [displayRoute?.depotLat, displayRoute?.depotLng, preservedMap?.depotLat, preservedMap?.depotLng]
  );

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
            <DriverMap
              bins={visibleMapBins}
              routePolyline={visibleMapPath}
              depotCoords={stableDepotCoords}
              driverPosition={driverPosition}
              isTrackingGps={isTracking}
            />
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

      <DriverMap
        bins={displayRoute.bins}
        routePolyline={routePath}
        depotCoords={stableDepotCoords}
        driverPosition={driverPosition}
        isTrackingGps={isTracking}
      />

      {!isTracking && (
        <p className="rounded-lg border border-[#f0dfb2] bg-[#fff8e8] px-3 py-2 text-xs text-[#7a5a13]">
          {gpsError
            ? "GPS unavailable — enable location to verify bin proximity. Skip stops can still be queued offline."
            : "Acquiring GPS signal… The blue dot tracks your live position as you move."}
        </p>
      )}

      {isTracking && driverPosition && (
        <p className="text-xs text-[#5f7167]">
          Blue dot shows your live GPS position and updates as you move. If signal drops, it stays at your last known location.
        </p>
      )}

      <DriverRoutePanel
        key={displayRoute.routeId}
        displayRoute={displayRoute}
        binStatusUpdate={binStatusUpdate}
        isConfirmingComplete={isConfirmingComplete}
        isCompletingRoute={isCompletingRoute}
        isOnline={isOnline}
        onSetConfirmingComplete={setIsConfirmingComplete}
        onUpdateBinStatus={updateBinStatus}
        onCompleteRoute={handleCompleteRoute}
      />
    </div>
  );
}
