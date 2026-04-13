"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from '../../lib/apiFetch';
import dynamic from 'next/dynamic';
import useSWR from 'swr'; //Stale-While-Revalidate for data fetching and caching [Polling]
import { toast } from "sonner";

type AdminDashboardSection = "dashboard" | "status" | "create";

interface PendingRoute {
  routeId: string;
  driverName: string;
  progress: string;
  isComplete: boolean;
}

export interface Bin {
  id: string;
  zone: string;
  status: string | null;
  latitude: number;
  longitude: number;
}

interface Driver {
  id: string;
  name: string;
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return res.json();
};

const getApiErrorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  } catch {
    // Fall through to fallback message when response body is not JSON.
  }

  return fallback;
};

// Dynamically import the map, disabling Server-Side Rendering
const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => <div className="h-100 w-full soft-surface flex items-center justify-center text-[#557064]">Loading Map Satellite Uplink...</div>
});

export default function AdminDashboard({ section = "dashboard" }: { section?: AdminDashboardSection }) {
  const [selectedBins, setSelectedBins] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [showNewDriverPassword, setShowNewDriverPassword] = useState(false);
  const [isDriverMenuOpen, setIsDriverMenuOpen] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [isAddingBin, setIsAddingBin] = useState(false);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const driverMenuRef = useRef<HTMLDivElement | null>(null);

  const [newBin, setNewBin] = useState({ latitude: "", longitude: "", zone: "" });
  const [newDriver, setNewDriver] = useState({ name: "", email: "", password: "" });

  const {
    data: bins = [],
    mutate: mutateBins,
  } = useSWR<Bin[]>("/api/bins", fetcher, {
    refreshInterval: 5000,
  });

  const {
    data: drivers = [],
    mutate: mutateDrivers,
  } = useSWR<Driver[]>("/api/users/drivers", fetcher);

  const {
    data: pendingRoutes = [],
    mutate: mutatePendingRoutes,
  } = useSWR<PendingRoute[]>("/api/routes/pending", fetcher, {
    refreshInterval: 5000,
  });

  const selectedDriverName =
    drivers.find((driver) => driver.id === selectedDriver)?.name ?? "-- Choose a Driver --";

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!driverMenuRef.current) return;
      if (driverMenuRef.current.contains(event.target as Node)) return;
      setIsDriverMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const toggleBinSelection = (binId: string) => {
    setSelectedBins((prev) =>
      prev.includes(binId) ? prev.filter(id => id !== binId) : [...prev, binId]
    );
  };

  const handleDriverSelection = (driverId: string) => {
    setSelectedDriver(driverId);
    setIsDriverMenuOpen(false);
  };

  const handleCreateRoute = async () => {
    if (isCreatingRoute) return;

    if (!selectedDriver || selectedBins.length === 0) {
      toast.warning("Select a driver and at least one bin before dispatching.");
      return;
    }

    setIsCreatingRoute(true);

    try {
      const res = await apiFetch("/api/routes", {
        method: "POST",
        body: JSON.stringify({
          driverId: selectedDriver,
          binIds: selectedBins
        })
      });

      if (res.ok) {
        toast.success("Route dispatched successfully.");
        setSelectedBins([]);
        await Promise.all([mutateBins(), mutatePendingRoutes()]);
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to create route right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while creating route. Please try again.");
    } finally {
      setIsCreatingRoute(false);
    }
  };

  const handleAddBin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAddingBin) return;

    const latitude = parseFloat(newBin.latitude);
    const longitude = parseFloat(newBin.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.warning("Enter valid latitude and longitude values.");
      return;
    }

    setIsAddingBin(true);

    try {
      const res = await apiFetch("/api/bins", {
        method: "POST",
        body: JSON.stringify({
          latitude,
          longitude,
          zone: newBin.zone
        })
      });
      if (res.ok) {
        toast.success("Bin registered successfully.");
        setNewBin({ latitude: "", longitude: "", zone: "" });
        await mutateBins();
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to register bin right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while registering bin. Please try again.");
    } finally {
      setIsAddingBin(false);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAddingDriver) return;

    setIsAddingDriver(true);

    try {
      const res = await apiFetch("/api/users/drivers", {
        method: "POST",
        body: JSON.stringify(newDriver)
      });
      if (res.ok) {
        toast.success("Driver account created successfully.");
        setNewDriver({ name: "", email: "", password: "" });
        await mutateDrivers();
      } else {
        toast.error(await getApiErrorMessage(res, "Unable to create driver account right now."));
      }
    } catch (error) {
      console.error(error);
      toast.error("Network issue while creating driver account. Please try again.");
    } finally {
      setIsAddingDriver(false);
    }
  };

  return (
    <div className="space-y-8">
      {section === "dashboard" && (
        <>
          <section className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#f8fcf9]">
            <div className="flex items-center justify-between border-b border-[#e4ece6] px-5 py-4">
              <h2 className="text-xl font-extrabold text-[#1d3026]">Live Zone Map</h2>
              <span className="soft-pill">Auto Sync: 5s</span>
            </div>
            <div className="p-5 pt-4">
              <RouteMap bins={bins} />
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div>
              <h2 className="mb-4 text-2xl font-extrabold text-[#1d3026]">Admin Control Center</h2>
              <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
                <div className="grid grid-cols-[1fr_auto] border-b border-[#e6efe9] bg-[#f8fcf9] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                  <span>Bin And Zone</span>
                  <span>Status</span>
                </div>
                <ul className="divide-y divide-[#edf2ee]">
                  {bins.map((bin) => (
                    <li key={bin.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm odd:bg-[#fcfffd] even:bg-[#f6fbf8]">
                      <div>
                        <input
                          type="checkbox"
                          className="mr-3 accent-[#1a7b3a]"
                          checked={selectedBins.includes(bin.id)}
                          onChange={() => toggleBinSelection(bin.id)}
                          disabled={bin.status === 'ASSIGNED_TODAY'}
                        />
                        <span className="font-semibold text-[#244734]">Bin #{bin.id.substring(0,6)} | Zone: {bin.zone}</span>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-extrabold uppercase ${
                        bin.status === 'collected' ? 'bg-green-100 text-green-700' :
                        bin.status === 'overflowing' ? 'bg-red-100 text-red-700' :
                        bin.status === 'ASSIGNED_TODAY' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {bin.status === 'ASSIGNED_TODAY' ? 'ON ROUTE' : (bin.status || 'UNASSIGNED')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="rounded-2xl border-l-4 border-[#1f8a52] bg-[#f9fcfa] p-5">
              <h3 className="mb-4 text-lg font-extrabold text-[#1f412f]">Dispatch Route</h3>

              <label className="mb-2 block text-sm font-bold text-[#244734]">Select Driver:</label>
              <div ref={driverMenuRef} className="relative mb-4">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isDriverMenuOpen}
                  onClick={() => setIsDriverMenuOpen((prev) => !prev)}
                  className={`dropdown-clean ${isDriverMenuOpen ? "dropdown-clean-open" : ""}`}
                >
                  <span className={selectedDriver ? "text-[#1f3b2d]" : "text-[#4f6759]"}>{selectedDriverName}</span>
                  <ChevronIcon open={isDriverMenuOpen} />
                </button>

                {isDriverMenuOpen && (
                  <div role="listbox" className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedDriver === ""}
                      className={`dropdown-option ${selectedDriver === "" ? "dropdown-option-selected" : ""}`}
                      onClick={() => handleDriverSelection("")}
                    >
                      -- Choose a Driver --
                    </button>
                    <div className="max-h-56 overflow-y-auto">
                      {drivers.map((driver) => (
                        <button
                          key={driver.id}
                          type="button"
                          role="option"
                          aria-selected={selectedDriver === driver.id}
                          className={`dropdown-option ${selectedDriver === driver.id ? "dropdown-option-selected" : ""}`}
                          onClick={() => handleDriverSelection(driver.id)}
                        >
                          {driver.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-5 border-y border-[#dde8e0] py-3 text-sm font-semibold text-[#3f5b4b]">
                Selected Bins: {selectedBins.length}
              </div>

              <button
                onClick={handleCreateRoute}
                disabled={isCreatingRoute}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingRoute ? "Dispatching Route..." : "Dispatch To Driver"}
              </button>
            </aside>
          </section>
        </>
      )}

      {section === "status" && (
        <section>
          <h3 className="mb-4 text-2xl font-extrabold text-[#1d3026]">Active Operations (Pending Routes)</h3>
          {pendingRoutes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#cddbd2] bg-[#f8fcf9] p-5 text-sm italic text-[#5c7165]">No active routes currently deployed.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_150px] border-b border-[#e6efe9] bg-[#f8fcf9] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                <span>Driver</span>
                <span>Route</span>
                <span>Progress</span>
                <span>State</span>
              </div>
              {pendingRoutes.map(route => (
                <div key={route.routeId} className="grid grid-cols-[1.2fr_1fr_1fr_150px] items-center border-b border-[#eef3ef] px-4 py-3 text-sm last:border-b-0">
                  <span className="font-semibold text-[#1f3b2d]">{route.driverName}</span>
                  <span className="text-[#5a6f63]">{route.routeId.substring(0, 8)}...</span>
                  <span className="font-semibold text-[#2b4a3a]">{route.progress}</span>
                  <span className={`w-fit rounded-full px-2 py-1 text-xs font-extrabold ${route.isComplete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {route.isComplete ? 'READY TO COMPLETE' : 'IN PROGRESS'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {section === "create" && (
        <section className="grid gap-7 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[#e4ece6] bg-[#f8fcf9] p-6">
            <h3 className="mb-4 text-xl font-extrabold text-[#1f412f]">Register New Bin</h3>
            <form onSubmit={handleAddBin} className="space-y-3">
              <input type="number" step="any" placeholder="Latitude (e.g. 30.316)" required
                className="input-clean"
                value={newBin.latitude} onChange={e => setNewBin({...newBin, latitude: e.target.value})} />
              <input type="number" step="any" placeholder="Longitude (e.g. 78.032)" required
                className="input-clean"
                value={newBin.longitude} onChange={e => setNewBin({...newBin, longitude: e.target.value})} />
              <input type="text" placeholder="Zone Name (e.g. North)" required
                className="input-clean"
                value={newBin.zone} onChange={e => setNewBin({...newBin, zone: e.target.value})} />
              <button
                type="submit"
                disabled={isAddingBin}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAddingBin ? "Adding Bin..." : "Add Bin"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-[#e4ece6] bg-[#f9fdfb] p-6">
            <h3 className="mb-4 text-xl font-extrabold text-[#1f412f]">Register New Driver</h3>
            <form onSubmit={handleAddDriver} className="space-y-3">
              <input type="text" placeholder="Full Name" required
                className="input-clean"
                value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} />
              <input type="email" placeholder="Email Address" required
                className="input-clean"
                value={newDriver.email} onChange={e => setNewDriver({...newDriver, email: e.target.value})} />
              <div className="relative">
                <input type={showNewDriverPassword ? "text" : "password"} placeholder="Temporary Password" required
                  className="input-clean pr-11"
                  value={newDriver.password} onChange={e => setNewDriver({...newDriver, password: e.target.value})} />
                <button
                  type="button"
                  onClick={() => setShowNewDriverPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4c6658] transition hover:bg-[#e9f4ed] hover:text-[#1f6b40]"
                  aria-label={showNewDriverPassword ? "Hide password" : "Show password"}
                >
                  {showNewDriverPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isAddingDriver}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAddingDriver ? "Creating Driver..." : "Create Driver Account"}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2 12C3.9 8.5 7.4 6 12 6C16.6 6 20.1 8.5 22 12C20.1 15.5 16.6 18 12 18C7.4 18 3.9 15.5 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 6.2C11.1 6.1 11.5 6 12 6C16.6 6 20.1 8.5 22 12C21.1 13.6 19.8 15 18.3 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 8.3C4.7 9.2 3.5 10.5 2.8 12C4.7 15.5 8.1 18 12 18C13.5 18 14.8 17.6 16 16.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1 14.1C13.6 14.6 12.8 15 12 15C10.3 15 9 13.7 9 12C9 11.2 9.4 10.4 9.9 9.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 text-[#2c704a] transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
