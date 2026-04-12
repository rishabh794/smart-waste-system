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
  loading: () => <div className="h-100 w-full soft-surface mb-4 flex items-center justify-center text-[#557064]">Loading GPS Uplink...</div>
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
      <div className="soft-surface mt-4 p-8 text-center">
        <p className="text-sm font-black tracking-[0.16em] text-[#1a7b3a]">NO ACTIVE ROUTE</p>
        <p className="mt-2 text-lg font-bold text-[#1f412f]">No active routes. Enjoy the day off!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#e6efe9] pb-4">
        <h2 className="text-2xl font-extrabold text-[#1f412f]">Driver Interface</h2>
        <p className="mt-1 text-sm text-[#607267]">Track your assigned stops and update collection outcomes.</p>
      </div>

      <DriverMap bins={route.bins} routePolyline={routePath} depotCoords={DEPOT_COORDS} />

      <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
        <h3 className="px-4 pt-4 text-lg font-extrabold text-[#1f412f]">
          Today Route (ID: {route.routeId ? route.routeId.substring(0,8) + '...' : 'None'})
        </h3>
        
        {route.bins?.length > 0 ? (
          <>
            <ul className="mb-4 divide-y divide-[#edf3ee] border-y border-[#edf3ee]">
              {route.bins.map((bin) => (
                <li key={bin.binId} className="flex flex-col px-4 py-4 odd:bg-[#fcfffd] even:bg-[#f6fbf8]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#244734]">Stop {bin.sequence}: Bin #{bin.binId.substring(0,5)} ({bin.zone})</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-extrabold uppercase ${
                      bin.status === 'collected' ? 'bg-green-100 text-green-700' : 
                      bin.status === 'overflowing' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {bin.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateBinStatus(bin.binId, 'collected')}
                      className="w-1/2 rounded-md border border-[#cfdacb] bg-[#eef5ea] px-3 py-2 text-sm font-bold text-[#17311f] transition hover:border-[#1a7b3a] hover:bg-[#dff0d8]"
                    >
                      Collected
                    </button>
                    <button 
                      onClick={() => updateBinStatus(bin.binId, 'overflowing')}
                      className="w-1/2 rounded-md border border-[#e8c4c4] bg-[#fff5f5] px-3 py-2 text-sm font-bold text-[#7d2222] transition hover:bg-[#ffe8e8]"
                    >
                      Overflowing
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button 
              onClick={handleCompleteRoute}
              className="btn-primary mx-4 mb-4 mt-2 w-[calc(100%-2rem)]"
            >
              Finish Day Route
            </button>
          </>
        ) : (
          <p className="mb-4 rounded-md border border-[#c8e6ce] bg-[#eefaf0] p-3 font-bold text-[#2c6f39]">No bins assigned today. Enjoy the day off!</p>
        )}
      </div>
    </div>
  );
}