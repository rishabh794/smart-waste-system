"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import type { RouteBin } from "@/types/DriverTypes";

// Keep your custom CSS marker logic
const getMarkerIcon = (status: string, isDepot: boolean = false) => {
  if (isDepot) {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div class="w-8 h-8 rounded-sm border-2 border-[#f2bf49] bg-[#146933] shadow-lg flex items-center justify-center text-white font-bold text-xs">HQ</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16],
    });
  }

  let bgColor = 'bg-yellow-500'; // Pending
  if (status === 'collected') bgColor = 'bg-green-500';
  if (status === 'overflowing') bgColor = 'bg-red-500 animate-pulse';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${bgColor}"></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
};

interface DriverMapProps {
  bins: RouteBin[];
  routePolyline: [number, number][]; // Array of [lat, lng] for the blue line
  depotCoords: [number, number];
}

export default function DriverMap({ bins, routePolyline, depotCoords }: DriverMapProps) {
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
          return (
            <Marker key={bin.binId} position={[bin.latitude, bin.longitude]} icon={getMarkerIcon(bin.status)}>
              <Popup>
                <div className="text-black">
                  <strong>Stop {bin.optimizedSequence || bin.sequence}: Bin #{bin.binId.substring(0,5)}</strong><br/>
                  Zone: {bin.zone}<br/>
                  Status: {bin.status}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
