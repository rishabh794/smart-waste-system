"use client";

import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";

interface MapFitBoundsProps {
  positions: [number, number][];
}

export default function MapFitBounds({ positions }: MapFitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }

    map.fitBounds(L.latLngBounds(positions), { padding: [24, 24] });
  }, [map, positions]);

  return null;
}
