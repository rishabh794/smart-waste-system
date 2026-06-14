"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { RouteBin } from "@/types/DriverTypes";

// Keep your custom CSS marker logic
const getMarkerIcon = (status: string, isDepot: boolean = false, wasOverflowing: boolean = false) => {
  if (isDepot) {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div class="w-8 h-8 rounded-sm border-2 border-[#f2bf49] bg-[#146933] shadow-lg flex items-center justify-center text-white font-bold text-xs">HQ</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16],
    });
  }

  let bgColor = 'bg-yellow-500'; // Pending
  if (status === 'collected') bgColor = 'bg-green-500';
  if (status === 'collected' && wasOverflowing) bgColor = 'bg-red-500 animate-pulse';
  if (status === 'missed') bgColor = 'bg-orange-500';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${bgColor}"></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
};

interface DriverMapProps {
  bins: RouteBin[];
  routePolyline: [number, number][];
  depotCoords: [number, number];
  driverPosition?: { latitude: number; longitude: number } | null;
  isTrackingGps?: boolean;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function DriverMap({
  bins,
  routePolyline,
  depotCoords,
  driverPosition,
  isTrackingGps = false,
}: DriverMapProps) {
  const formatBinStatusLabel = (bin: RouteBin) => {
    if (bin.status === 'collected' && bin.wasOverflowing) {
      return 'collected (overflow observed)';
    }

    return bin.status;
  };

  return (
    <div className="relative z-0 mb-4 h-100 w-full overflow-hidden rounded-xl border border-[#dce7df] bg-[#f7fcf8]">
      <MapContainer 
        center={depotCoords} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={depotCoords} />

        {driverPosition && (
          <Marker
            position={[driverPosition.latitude, driverPosition.longitude]}
            icon={L.divIcon({
              className: "custom-leaflet-icon",
              html: `<div class="relative flex h-7 w-7 items-center justify-center">
                <span class="absolute h-7 w-7 animate-ping rounded-full ${isTrackingGps ? "bg-blue-400/40" : "bg-orange-400/40"}"></span>
                <span class="relative h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-lg"></span>
              </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })}
          >
            <Popup>
              <div className="text-black">
                <strong>Your location</strong>
                <br />
                {isTrackingGps ? "Live GPS — updates as you move" : "Last known position"}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Draw the Route Line */}
        {routePolyline.length > 0 && (
          <Polyline positions={routePolyline} color="#1a7b3a" weight={5} opacity={0.85} />
        )}

        {/* The Depot Marker */}
        <Marker position={depotCoords} icon={getMarkerIcon('', true)}>
          <Popup><strong className="text-black">Central Depot</strong></Popup>
        </Marker>
        
        {/* The Bin Markers */}
        {bins.map((bin) => {
          if (!bin.latitude || !bin.longitude) return null;
          const stopNumber = bin.optimizedSequence ?? bin.sequence;
          return (
            <Marker
              key={bin.binId}
              position={[bin.latitude, bin.longitude]}
              icon={getMarkerIcon(bin.status, false, Boolean(bin.wasOverflowing))}
            >
              <Popup>
                <div className="text-black">
                  <strong>Stop {stopNumber}: Bin #{bin.binId.substring(0,5)}</strong><br/>
                  Zone: {bin.zone}<br/>
                  Status: {formatBinStatusLabel(bin)}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
