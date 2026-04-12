"use client";

import { useState, useEffect } from "react";

interface RouteData {
  routeId: string;
  bins: Array<{
    binId: string;
    sequence: number;
    zone: string;
    status: string;
  }>;
}

export default function DriverDashboard({ userId }: { userId: string }) {
  const [route, setRoute] = useState<RouteData | null>(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/routes/driver/${userId}`)
      .then((res) => res.json())
      .then((data) => setRoute(data))
      .catch((err) => console.error(err));
  }, [userId]);

  if (!route) return <div className="mt-4 p-4 font-mono border border-black">Loading route...</div>;

  return (
    <div className="border border-black p-4 mt-4">
      <h2 className="text-xl font-bold mb-4">Driver Interface</h2>
      <div className="border border-gray-400 p-4 mb-4">
        <h3 className="font-bold mb-2">
          Today Route (ID: {route.routeId ? route.routeId.substring(0,8) + '...' : 'None'})
        </h3>
        
        {route.bins?.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {route.bins.map((bin: { binId: string; sequence: number; zone: string; status: string }) => (
              <li key={bin.binId} className="flex justify-between items-center p-3 border ">
                <span>Stop {bin.sequence}: Bin #{bin.binId.substring(0,5)} ({bin.zone})</span>
                <span className="text-sm font-bold uppercase">{bin.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-green-600 font-bold border p-2">No bins assigned today. Enjoy the day off!</p>
        )}

        <button className="border border-black p-4 w-full font-bold text-lg">
          Start Collection Route
        </button>
      </div>
    </div>
  );
}