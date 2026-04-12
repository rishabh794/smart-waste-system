"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const fixLeafletIcons = () => {
  const iconPrototype = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: string;
  };
  delete iconPrototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

interface Bin {
  id: string;
  latitude: number;
  longitude: number;
  zone: string;
  status: string | null;
}

export default function RouteMap({ bins }: { bins: Bin[] }) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Center the map on Dehradun based on your previous coordinates
  const centerPosition: [number, number] = [30.316, 78.032]; 

  return (
    <div className="h-[400px] w-full border border-gray-600 relative z-0">
      <MapContainer 
        center={centerPosition} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bins.map((bin) => {
          // Skip bins with bad coordinates
          if (!bin.latitude || !bin.longitude) return null;

          return (
            <Marker key={bin.id} position={[bin.latitude, bin.longitude]}>
              <Popup>
                <div className="text-black">
                  <strong>Bin #{bin.id.substring(0, 6)}</strong><br />
                  Zone: {bin.zone}<br />
                  Status: <span className="uppercase font-bold">{bin.status || 'UNASSIGNED'}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}