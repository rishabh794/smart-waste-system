"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface DriverCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: number;
}

const POSITION_MAX_AGE_MS = 120_000;
const POSITION_TIMEOUT_MS = 12_000;

const isFreshPosition = (position: DriverCoordinates | null) =>
  Boolean(position && Date.now() - position.capturedAt <= POSITION_MAX_AGE_MS);

export const useDriverLocation = () => {
  const [driverPosition, setDriverPosition] = useState<DriverCoordinates | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const latestPositionRef = useRef<DriverCoordinates | null>(null);

  const applyPosition = useCallback((coords: GeolocationCoordinates) => {
    const nextPosition: DriverCoordinates = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      capturedAt: Date.now(),
    };

    latestPositionRef.current = nextPosition;
    setDriverPosition(nextPosition);
    setGpsError(null);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        applyPosition(position.coords);
        setIsTracking(true);
      },
      (error) => {
        setIsTracking(false);
        setGpsError(error.message || "Unable to track GPS.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: POSITION_TIMEOUT_MS,
      }
    );

    navigator.geolocation.getCurrentPosition(
      (position) => applyPosition(position.coords),
      () => {
        // watchPosition may still succeed after an initial timeout.
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: POSITION_TIMEOUT_MS,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [applyPosition]);

  const getPositionForUpdate = useCallback(async (): Promise<DriverCoordinates | null> => {
    if (isFreshPosition(latestPositionRef.current)) {
      return latestPositionRef.current;
    }

    if (!navigator.geolocation) {
      return latestPositionRef.current;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: POSITION_MAX_AGE_MS,
          timeout: POSITION_TIMEOUT_MS,
        });
      });

      applyPosition(position.coords);
      return latestPositionRef.current;
    } catch {
      return isFreshPosition(latestPositionRef.current) ? latestPositionRef.current : null;
    }
  }, [applyPosition]);

  return {
    driverPosition,
    isTracking,
    gpsError,
    getPositionForUpdate,
  };
};
