"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

interface Bin {
  id: string;
  latitude: number;
  longitude: number;
  zone: string;
  status: string | null;
}

// NEW: Dynamic Icon Generator
const getMarkerIcon = (status: string | null) => {
  let bgColor = 'bg-gray-500'; // Default UNASSIGNED
  let pulse = '';

  if (status === 'collected') bgColor = 'bg-green-500';
  if (status === 'ASSIGNED_TODAY') bgColor = 'bg-yellow-500';
  if (status === 'overflowing') {
    bgColor = 'bg-red-500';
    pulse = 'animate-pulse'; // Make overflowing bins flash!
  }

  const html = `
    <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${bgColor} ${pulse}">
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-icon', // Removes default Leaflet styling
    html: html,
    iconSize: [24, 24],
    iconAnchor: [12, 12], // Centers the circle on the exact coordinate
  });
};

export default function RouteMap({ bins }: { bins: Bin[] }) {
  // Center on Dehradun
  const centerPosition: [number, number] = [30.316, 78.032]; 

  return (
    <div className="h-[400px] w-full relative z-0">
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
              icon={getMarkerIcon(bin.status)} // NEW: Apply the custom icon
            >
              <Popup>
                <div className="text-black min-w-[150px]">
                  <strong className="text-lg">Bin #{bin.id.substring(0, 6)}</strong>
                  <div className="border-t border-gray-300 my-1"></div>
                  <div><strong>Zone:</strong> {bin.zone}</div>
                  <div>
                    <strong>Status:</strong> 
                    <span className={`ml-1 font-bold uppercase ${
                      bin.status === 'collected' ? 'text-green-600' : 
                      bin.status === 'overflowing' ? 'text-red-600' : 
                      bin.status === 'ASSIGNED_TODAY' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {bin.status === 'ASSIGNED_TODAY' ? 'ON ROUTE' : (bin.status || 'UNASSIGNED')}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}