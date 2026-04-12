"use client";

import { useState, useEffect } from "react";
import { apiFetch } from '../../lib/apiFetch';

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

  const [newBin, setNewBin] = useState({ latitude: "", longitude: "", zone: "" });
  const [newDriver, setNewDriver] = useState({ name: "", email: "", password: "" });

  const loadData = () => {
    // Fetch bins and drivers
    apiFetch("/api/bins")
      .then((res) => res.json())
      .then((data) => setBins(data))
      .catch(console.error);

    apiFetch("/api/users/drivers")
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
      const res = await apiFetch("/api/routes", {
        method: "POST",
        body: JSON.stringify({
            driverId: selectedDriver,
            binIds: selectedBins
           })
        });

      if (res.ok) {
        alert("Route successfully dispatched!");
        setSelectedBins([]); 
        loadData(); 
      } else {
        alert("Failed to create route.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddBin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/bins", {
        method: "POST",
        body: JSON.stringify({
          latitude: parseFloat(newBin.latitude),
          longitude: parseFloat(newBin.longitude),
          zone: newBin.zone
        })
      });
      if (res.ok) {
        alert("Bin added successfully!");
        setNewBin({ latitude: "", longitude: "", zone: "" });
        loadData();
      }
    } catch (error) { console.error(error); }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/users/drivers", {
        method: "POST",
        body: JSON.stringify(newDriver)
      });
      if (res.ok) {
        alert("Driver created successfully!");
        setNewDriver({ name: "", email: "", password: "" });
        loadData();
      } else {
        const errorData = await res.json();
        alert(`Failed: ${errorData.error}`);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="border border-gray-600 p-4">
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
              className="w-full border border-gray-600 p-2 mb-4 bg-gray-800 text-white"
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

      <div className="flex gap-4">
        <div className="border border-gray-600 p-4 w-1/2">
          <h3 className="font-bold mb-4 text-lg">Register New Bin</h3>
          <form onSubmit={handleAddBin} className="space-y-3">
            <input type="number" step="any" placeholder="Latitude (e.g. 30.316)" required
              className="w-full border border-gray-600 p-2 bg-transparent"
              value={newBin.latitude} onChange={e => setNewBin({...newBin, latitude: e.target.value})} />
            <input type="number" step="any" placeholder="Longitude (e.g. 78.032)" required
              className="w-full border border-gray-600 p-2 bg-transparent"
              value={newBin.longitude} onChange={e => setNewBin({...newBin, longitude: e.target.value})} />
            <input type="text" placeholder="Zone Name (e.g. North)" required
              className="w-full border border-gray-600 p-2 bg-transparent"
              value={newBin.zone} onChange={e => setNewBin({...newBin, zone: e.target.value})} />
            <button type="submit" className="w-full border border-gray-600 p-2 font-bold hover:bg-gray-800">
              Add Bin
            </button>
          </form>
        </div>

        <div className="border border-gray-600 p-4 w-1/2">
          <h3 className="font-bold mb-4 text-lg">Register New Driver</h3>
          <form onSubmit={handleAddDriver} className="space-y-3">
            <input type="text" placeholder="Full Name" required
              className="w-full border border-gray-600 p-2 bg-transparent"
              value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} />
            <input type="email" placeholder="Email Address" required
              className="w-full border border-gray-600 p-2 bg-transparent"
              value={newDriver.email} onChange={e => setNewDriver({...newDriver, email: e.target.value})} />
            <input type="password" placeholder="Temporary Password" required
              className="w-full border border-gray-600 p-2 bg-transparent"
              value={newDriver.password} onChange={e => setNewDriver({...newDriver, password: e.target.value})} />
            <button type="submit" className="w-full border border-gray-600 p-2 font-bold hover:bg-gray-800">
              Create Driver Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}