"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Bin } from "@/types/AdminTypes";

const getMarkerIcon = (bin: Bin) => {
  let bgColor = 'bg-gray-500'; // Default UNASSIGNED
  let pulse = '';

  if (bin.conditionStatus === 'retired') bgColor = 'bg-slate-500';
  if (bin.conditionStatus === 'maintenance') bgColor = 'bg-orange-500';
  if (bin.status === 'collected') bgColor = 'bg-green-500';
  if (bin.status === 'ASSIGNED_TODAY') bgColor = 'bg-yellow-500';
  if (bin.status === 'overflowing' || (typeof bin.fillLevel === 'number' && bin.fillLevel >= 80)) {
    bgColor = 'bg-red-500';
    pulse = 'animate-pulse'; 
  }
  if (bin.status === 'missed') bgColor = 'bg-orange-500';

  const html = `
    <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${bgColor} ${pulse}">
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-icon', 
    html: html,
    iconSize: [24, 24],
    iconAnchor: [12, 12], // Centers the circle on the exact coordinate
  });
};

export default function RouteMap({ bins }: { bins: Bin[] }) {
  // Center on Dehradun
  const centerPosition: [number, number] = [30.316, 78.032]; 

  const formatRouteStatus = (status: Bin['status']) => {
    if (status === 'ASSIGNED_TODAY') return 'ON ROUTE';
    if (!status) return 'UNASSIGNED';
    return status.toUpperCase();
  };

  const formatConditionStatus = (conditionStatus: Bin['conditionStatus']) => {
    if (!conditionStatus) return 'ACTIVE';
    return conditionStatus.toUpperCase();
  };

  const formatLastEmptiedAt = (value: Bin['lastEmptiedAt']) => {
    if (!value) return 'Never';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown';
    }

    return parsed.toLocaleString();
  };

  return (
    <div className="relative z-0 h-100 w-full overflow-hidden rounded-xl border border-[#dce7df] bg-[#f7fcf8]">
      <MapContainer 
        center={centerPosition} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bins.map((bin) => {
          if (!bin.latitude || !bin.longitude) return null;

          return (
            <Marker 
              key={bin.id} 
              position={[bin.latitude, bin.longitude]}
              icon={getMarkerIcon(bin)} 
            >
              <Popup>
                <div className="min-w-36 text-black">
                  <strong className="text-lg">Bin #{bin.id.substring(0, 6)}</strong>
                  <div className="border-t border-gray-300 my-1"></div>
                  <div><strong>Zone:</strong> {bin.zone ?? 'Unassigned'}</div>
                  <div>
                    <strong>Route:</strong> 
                    <span className={`ml-1 font-bold uppercase ${
                      bin.status === 'collected' ? 'text-green-600' : 
                      bin.status === 'overflowing' ? 'text-red-600' : 
                      bin.status === 'missed' ? 'text-orange-600' : 
                      bin.status === 'ASSIGNED_TODAY' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {formatRouteStatus(bin.status)}
                    </span>
                  </div>
                  <div><strong>Condition:</strong> {formatConditionStatus(bin.conditionStatus)}</div>
                  <div><strong>Fill Level:</strong> {bin.fillLevel ?? 0}%</div>
                  <div><strong>Fill Rate:</strong> {bin.fillRatePerDay ?? 0}% / day</div>
                  <div><strong>Last Emptied:</strong> {formatLastEmptiedAt(bin.lastEmptiedAt)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
