"use client";

import { useState, useEffect } from "react";
import { apiFetch } from '../../lib/apiFetch';
import dynamic from 'next/dynamic';
import polyline from '@mapbox/polyline';

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
  loading: () => <div className="h-[400px] w-full border border-gray-600 flex items-center justify-center bg-gray-900 text-gray-400 mb-4">Loading GPS Uplink...</div>
});

const DEPOT_COORDS: [number, number] = [30.316, 78.032];

export default function DriverDashboard({ userId }: { userId: string }) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  useEffect(() => {
    //  Fetch the raw route from your backend
    apiFetch(`/api/routes/driver/${userId}`)
      .then((res) => res.json())
      .then(async (data: RouteData | null) => {
        if (!data || !data.routeId) {
          setRoute(null);
          setRoutePath([]);
          return;
        }

        // Prepare coordinates for OSRM (WARNING: OSRM uses Longitude, Latitude order!)
        const depotStr = `${DEPOT_COORDS[1]},${DEPOT_COORDS[0]}`;
        const binStrs = data.bins
          .filter((b) => b.longitude && b.latitude)
          .map((b) => `${b.longitude},${b.latitude}`)
          .join(';');

        // If no valid coordinates, just set the route normally
        if (!binStrs) {
          setRoutePath([]);
          setRoute(data);
          return;
        }

        try {
          // Ask OSRM for the optimized Trip
          const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${depotStr};${binStrs}?roundtrip=true&source=first&geometries=polyline`;
          const osrmRes = await fetch(osrmUrl);
          const osrmData = (await osrmRes.json()) as OsrmTripResponse;

          if (osrmData.code === "Ok" && osrmData.trips?.[0]) {
            // Decode the math string into GPS points
            const decodedPath = polyline.decode(osrmData.trips[0].geometry);
            setRoutePath(decodedPath as [number, number][]);

            //  Re-sequence the bins based on OSRM's optimal order
            const optimizedBins: RouteBin[] = data.bins.map((bin, index: number) => {
              const osrmWaypoint = osrmData.waypoints?.[index + 1];
              return {
                ...bin,
                optimizedSequence: osrmWaypoint ? osrmWaypoint.waypoint_index : bin.sequence
              };
            }).sort(
              (a, b) =>
                (a.optimizedSequence ?? a.sequence) - (b.optimizedSequence ?? b.sequence)
            );

            setRoute({ ...data, bins: optimizedBins });
          } else {
            setRoutePath([]);
            setRoute(data); // Fallback if OSRM fails
          }
        } catch (error) {
          console.error("OSRM Routing Error:", error);
          setRoutePath([]);
          setRoute(data); // Fallback
        }
      })
      .catch((err) => console.error(err));
  }, [userId]);

  const updateBinStatus = async (binId: string, newStatus: string) => {
    if (!route?.routeId) return;

    try {
      const res = await apiFetch(`/api/routes/${route.routeId}/bins/${binId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
            });

      if (res.ok) {
        setRoute((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            bins: prev.bins.map((bin) =>
              bin.binId === binId ? { ...bin, status: newStatus } : bin
            ),
          };
        });
      } else {
        console.error("Failed to update bin status");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  const handleCompleteRoute = async () => {
    if (!route?.routeId) return;
    if (!confirm("Are you sure you want to complete today's route?")) return;

    try {
      const res = await apiFetch(`/api/routes/${route.routeId}/status`, { method: "PATCH" });
      
      if (res.ok) {
        alert("Route completed! Great job today.");
        setRoute(null);
      } else {
        const errorData = await res.json();
        alert(`❌ ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!route || !route.routeId) {
    return (
      <div className="mt-4 p-4 font-mono border border-gray-600 text-center">
        No active routes. Enjoy the day off!
      </div>
    );
  }

  return (
    <div className="border border-gray-600 p-4 mt-4">
      <h2 className="text-xl font-bold mb-4">Driver Interface</h2>
      <DriverMap bins={route.bins} routePolyline={routePath} depotCoords={DEPOT_COORDS} />
      <div className="border border-gray-600 p-4 mb-4">
        <h3 className="font-bold mb-4">
          Today Route (ID: {route.routeId ? route.routeId.substring(0,8) + '...' : 'None'})
        </h3>
        
        {route.bins?.length > 0 ? (
          <>
            <ul className="mb-4 space-y-2">
              {route.bins.map((bin) => (
                <li key={bin.binId} className="flex flex-col p-3 border border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span>Stop {bin.sequence}: Bin #{bin.binId.substring(0,5)} ({bin.zone})</span>
                    <span className={`text-sm font-bold uppercase ${
                      bin.status === 'collected' ? 'text-green-500' : 
                      bin.status === 'overflowing' ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {bin.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateBinStatus(bin.binId, 'collected')}
                      className="border border-gray-600 hover:bg-gray-800 px-3 py-2 text-sm font-bold w-1/2 transition-colors"
                    >
                      Collected
                    </button>
                    <button 
                      onClick={() => updateBinStatus(bin.binId, 'overflowing')}
                      className="border border-gray-600 hover:bg-gray-800 px-3 py-2 text-sm font-bold w-1/2 transition-colors"
                    >
                      Overflowing
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button 
              onClick={handleCompleteRoute}
              className="w-full border border-gray-600 p-4 mt-4 font-bold hover:bg-gray-800 transition-colors"
            >
              Finish Day Route
            </button>
          </>
        ) : (
          <p className="mb-4 text-green-500 font-bold border border-gray-600 p-2">No bins assigned today. Enjoy the day off!</p>
        )}
      </div>
    </div>
  );
}