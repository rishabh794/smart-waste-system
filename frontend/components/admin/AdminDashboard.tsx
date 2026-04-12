"use client";

import { useState, useEffect } from "react";

interface Bin {
  id: string;
  zone: string;
}

export default function AdminDashboard() {
  const [bins, setBins] = useState<Bin[]>([]); 

  useEffect(() => {
    // Passing the Admin role in the headers to pass the backend middleware
    fetch("http://localhost:5000/api/bins", {
      headers: { "x-user-role": "admin" }
    })
      .then((res) => res.json())
      .then((data) => setBins(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="border border-black p-4 mt-4">
      <h2 className="text-xl font-bold mb-4">Admin Control Center</h2>
      <div className="flex gap-4">
        <div className="border border-gray-400 p-4 w-1/2">
          <h3 className="font-bold mb-2">Manage Bins ({bins.length} Total)</h3>
          <ul className="mb-4 space-y-2">
            {bins.map((bin) => (
              <li key={bin.id} className="text-sm bg-gray-500 p-2 border">
                Bin #{bin.id.substring(0,8)}... | Zone: {bin.zone}
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-gray-400 p-4 w-1/2">
          <h3 className="font-bold mb-2">Route Assignment</h3>
          <p className="text-sm mb-4">Assign bins to drivers for today pickup.</p>
          <button className="border border-black p-2 w-full bg-gray-500">
            Create Route
          </button>
        </div>
      </div>
    </div>
  );
}