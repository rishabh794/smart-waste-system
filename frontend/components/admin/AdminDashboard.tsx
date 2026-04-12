"use client";

import { useState, useEffect } from "react";

interface Bin {
  id: string;
  zone: string;
  status: string | null;
}

interface Driver {
  id: string;
  name: string;
}

export default function AdminDashboard() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBins, setSelectedBins] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  const loadData = () => {
    fetch("http://localhost:5000/api/bins", { headers: { "x-user-role": "admin" } })
      .then((res) => res.json())
      .then((data) => setBins(data))
      .catch(console.error);

    fetch("http://localhost:5000/api/users/drivers", { headers: { "x-user-role": "admin" } })
      .then((res) => res.json())
      .then((data) => setDrivers(data))
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleBinSelection = (binId: string) => {
    setSelectedBins((prev) => 
      prev.includes(binId) ? prev.filter(id => id !== binId) : [...prev, binId]
    );
  };

  const handleCreateRoute = async () => {
    if (!selectedDriver || selectedBins.length === 0) {
      alert("Please select a driver and at least one bin.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/routes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": "admin" 
        },
        body: JSON.stringify({
          driverId: selectedDriver,
          binIds: selectedBins
        })
      });

      if (res.ok) {
        alert("Route successfully dispatched!");
        setSelectedBins([]); // Clear selection
        loadData(); // AUTO-REFRESH THE UI!
      } else {
        alert("Failed to create route.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="border border-gray-600 p-4 mt-4">
      <h2 className="text-xl font-bold mb-4">Admin Control Center</h2>
      <div className="flex gap-4">
        
        <div className="border border-gray-600 p-4 w-1/2">
          <h3 className="font-bold mb-4">Select Bins for Route</h3>
          <ul className="space-y-2">
            {bins.map((bin) => (
              <li key={bin.id} className="text-sm p-3 border border-gray-600 flex justify-between items-center bg-gray-800">
                <div>
                  <input 
                    type="checkbox" 
                    className="mr-3"
                    checked={selectedBins.includes(bin.id)}
                    onChange={() => toggleBinSelection(bin.id)}
                  />
                  <span>Bin #{bin.id.substring(0,6)} | Zone: {bin.zone}</span>
                </div>
                <span className={`font-bold uppercase ${
                  bin.status === 'collected' ? 'text-green-500' : 
                  bin.status === 'overflowing' ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {bin.status || 'UNASSIGNED'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-gray-600 p-4 w-1/2">
          <h3 className="font-bold mb-4">Dispatch Route</h3>
          
          <label className="block text-sm font-bold mb-2">Select Driver:</label>
          <select 
            className="w-full border border-gray-600 p-2 mb-4 bg-white text-black"
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            <option value="">-- Choose a Driver --</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>{driver.name}</option>
            ))}
          </select>

          <div className="mb-4 text-sm">
            <strong>Selected Bins:</strong> {selectedBins.length}
          </div>

          <button 
            onClick={handleCreateRoute}
            className="border border-gray-600 p-3 w-full bg-blue-600 hover:bg-blue-700 font-bold text-white transition-colors"
          >
            Dispatch to Driver
          </button>
        </div>

      </div>
    </div>
  );
}