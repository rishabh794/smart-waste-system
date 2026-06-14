"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import dynamic from "next/dynamic";
import { ChevronIcon } from "@/components/ui/icons";
import type { Bin, BinConditionStatus, City, Driver } from "@/types/AdminTypes";

const RouteMap = dynamic(() => import("../RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-100 w-full soft-surface flex items-center justify-center text-[#557064]">
      Loading Map Satellite Uplink...
    </div>
  ),
});

interface AdminDashboardContentProps {
  bins: Bin[];
  drivers: Driver[];
  cities: City[];
  selectedBins: string[];
  selectedDriver: string;
  selectedDriverName: string;
  isDriverMenuOpen: boolean;
  isCreatingRoute: boolean;
  isUpdatingBins: boolean;
  driverMenuRef: RefObject<HTMLDivElement | null>;
  onToggleDriverMenu: () => void;
  onToggleBinSelection: (binId: string) => void;
  onSelectDriver: (driverId: string) => void;
  onCreateRoute: () => void;
  onUpdateSelectedBinsConditionStatus: (status: BinConditionStatus) => void;
}

const getRouteStatusMeta = (bin: Bin) => {
  if (bin.status === "collected" && Boolean(bin.wasOverflowing)) {
    return {
      label: "COLLECTED (OVERFLOW)",
      classes: "bg-red-100 text-red-700",
    };
  }

  const status = bin.status;

  if (status === "collected") {
    return {
      label: "COLLECTED",
      classes: "bg-green-100 text-green-700",
    };
  }

  if (status === "missed") {
    return {
      label: "MISSED",
      classes: "bg-orange-100 text-orange-700",
    };
  }

  if (status === "ASSIGNED_TODAY") {
    return {
      label: "ON ROUTE",
      classes: "bg-yellow-100 text-yellow-700",
    };
  }

  if (status === "unknown") {
    return {
      label: "UNKNOWN",
      classes: "bg-gray-100 text-gray-600",
    };
  }

  return {
    label: "UNASSIGNED",
    classes: "bg-gray-100 text-gray-600",
  };
};

const normalizeConditionStatus = (conditionStatus: Bin["conditionStatus"]) => {
  return conditionStatus ?? "active";
};

const conditionStatusOptions: Array<{ value: BinConditionStatus; label: string }> = [
  { value: "active", label: "Set Active" },
  { value: "maintenance", label: "Set Maintenance" },
  { value: "retired", label: "Set Retired" },
];

const formatLastEmptiedAt = (value: Bin["lastEmptiedAt"]) => {
  if (!value) return "Never";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
};

export default function AdminDashboardContent({
  bins,
  drivers,
  cities,
  selectedBins,
  selectedDriver,
  selectedDriverName,
  isDriverMenuOpen,
  isCreatingRoute,
  isUpdatingBins,
  driverMenuRef,
  onToggleDriverMenu,
  onToggleBinSelection,
  onSelectDriver,
  onCreateRoute,
  onUpdateSelectedBinsConditionStatus,
}: AdminDashboardContentProps) {

  const [selectedCityFilter, setSelectedCityFilter] = useState<string | null>(null);
  const [isCityFilterMenuOpen, setIsCityFilterMenuOpen] = useState(false);
  const cityFilterMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!cityFilterMenuRef.current) return;
      if (cityFilterMenuRef.current.contains(event.target as Node)) return;
      setIsCityFilterMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredBins = selectedCityFilter
    ? bins.filter((b) => b.cityId === selectedCityFilter)
    : bins;

  const filteredDrivers = selectedCityFilter
    ? drivers.filter((d) => d.cityId === selectedCityFilter)
    : drivers;

  const selectedCityObj = selectedCityFilter
    ? cities.find((c) => c.id === selectedCityFilter)
    : null;

  const mapCenter: [number, number] | undefined =
    selectedCityObj && selectedCityObj.depotLat && selectedCityObj.depotLng
      ? [selectedCityObj.depotLat, selectedCityObj.depotLng]
      : undefined;

  const binSections: Array<{
    key: "active" | "maintenance" | "retired";
    title: string;
    emptyMessage: string;
    bins: Bin[];
  }> = [
    {
      key: "active",
      title: "Active Bins",
      emptyMessage: "No active bins available.",
      bins: filteredBins.filter((bin) => normalizeConditionStatus(bin.conditionStatus) === "active"),
    },
    {
      key: "maintenance",
      title: "Maintenance Bins",
      emptyMessage: "No maintenance bins right now.",
      bins: filteredBins.filter((bin) => normalizeConditionStatus(bin.conditionStatus) === "maintenance"),
    },
    {
      key: "retired",
      title: "Retired Bins",
      emptyMessage: "No retired bins right now.",
      bins: filteredBins.filter((bin) => normalizeConditionStatus(bin.conditionStatus) === "retired"),
    },
  ];

  const getDriverDisplayName = (driver: Driver) => {
    return driver.cityName ? `${driver.name} — ${driver.cityName}` : driver.name;
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#f8fcf9]">
        <div className="flex items-center justify-between border-b border-[#e4ece6] px-5 py-4">
          <h2 className="text-xl font-extrabold text-[#1d3026]">Live Zone Map</h2>
          <div className="flex items-center gap-3">
            <div ref={cityFilterMenuRef} className="relative w-48">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isCityFilterMenuOpen}
                onClick={() => setIsCityFilterMenuOpen((prev) => !prev)}
                className={`dropdown-clean bg-white py-1.5 text-sm ${isCityFilterMenuOpen ? "dropdown-clean-open" : ""}`}
              >
                <span className={selectedCityFilter ? "text-[#1f3b2d]" : "text-[#4f6759]"}>
                  {selectedCityFilter
                    ? cities.find((c) => c.id === selectedCityFilter)?.name
                    : "All Cities"}
                </span>
                <ChevronIcon open={isCityFilterMenuOpen} />
              </button>

              {isCityFilterMenuOpen && (
                <div
                  role="listbox"
                  className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedCityFilter === null}
                    className={`dropdown-option ${selectedCityFilter === null ? "dropdown-option-selected" : ""}`}
                    onClick={() => {
                      setSelectedCityFilter(null);
                      setIsCityFilterMenuOpen(false);
                    }}
                  >
                    All Cities
                  </button>
                  <div className="max-h-56 overflow-y-auto">
                    {cities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        role="option"
                        aria-selected={selectedCityFilter === city.id}
                        className={`dropdown-option ${selectedCityFilter === city.id ? "dropdown-option-selected" : ""}`}
                        onClick={() => {
                          setSelectedCityFilter(city.id);
                          setIsCityFilterMenuOpen(false);
                        }}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="soft-pill shrink-0 whitespace-nowrap">Auto Sync: 5s</span>
          </div>
        </div>
        <div className="p-5 pt-4">
          <RouteMap bins={filteredBins} center={mapCenter} />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div>
          <h2 className="mb-4 text-2xl font-extrabold text-[#1d3026]">Admin Control Center</h2>
          <div className="space-y-3">
            {filteredBins.length === 0 ? (
              <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd] px-4 py-4 text-sm italic text-[#5c7165]">
                No bins available yet. Register bins from the Create page.
              </div>
            ) : (
              binSections.map((section) => (
                <details key={section.key} open className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
                  <summary className="flex cursor-pointer items-center justify-between border-b border-[#e6efe9] bg-[#f8fcf9] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                    <span>{section.title}</span>
                    <span className="soft-pill">{section.bins.length}</span>
                  </summary>

                  <ul className="divide-y divide-[#edf2ee]">
                    {section.bins.length === 0 ? (
                      <li className="px-4 py-4 text-sm italic text-[#5c7165]">{section.emptyMessage}</li>
                    ) : (
                      section.bins.map((bin) => {
                        const routeMeta = getRouteStatusMeta(bin);
                        const isOnRoute = bin.status === "ASSIGNED_TODAY";

                        return (
                          <li
                            key={bin.id}
                            className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm odd:bg-[#fcfffd] even:bg-[#f6fbf8]"
                          >
                            <div>
                              {!isOnRoute ? (
                                <input
                                  type="checkbox"
                                  className="mr-3 accent-[#1a7b3a]"
                                  checked={selectedBins.includes(bin.id)}
                                  onChange={() => onToggleBinSelection(bin.id)}
                                />
                              ) : (
                                <span className="mr-3 inline-flex rounded-full border border-[#d8dfdb] bg-[#f2f6f3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7c72]">
                                  Locked
                                </span>
                              )}

                              <span className="font-semibold text-[#244734]">
                                Bin #{bin.id.substring(0, 6)} | City: {bin.zone ?? "Unassigned"}
                              </span>
                              <p className="mt-1 text-xs text-[#5a7062]">
                                Fill: {bin.fillLevel ?? 0}% | Rate: {bin.fillRatePerDay ?? 0}%/day | Last emptied: {formatLastEmptiedAt(bin.lastEmptiedAt)}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className={`rounded-full px-2 py-1 text-xs font-extrabold uppercase ${routeMeta.classes}`}>
                                Route: {routeMeta.label}
                              </span>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </details>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border-l-4 border-[#1f8a52] bg-[#f9fcfa] p-5">
            <h3 className="mb-4 text-lg font-extrabold text-[#1f412f]">Dispatch Route</h3>

          <label className="mb-2 block text-sm font-bold text-[#244734]">Select Driver:</label>
          <div ref={driverMenuRef} className="relative mb-4">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isDriverMenuOpen}
              onClick={onToggleDriverMenu}
              className={`dropdown-clean ${isDriverMenuOpen ? "dropdown-clean-open" : ""}`}
            >
              <span className={selectedDriver ? "text-[#1f3b2d]" : "text-[#4f6759]"}>
                {selectedDriver
                  ? getDriverDisplayName(drivers.find((d) => d.id === selectedDriver) ?? { id: "", name: selectedDriverName, cityId: null, cityName: null })
                  : "-- Choose a Driver --"}
              </span>
              <ChevronIcon open={isDriverMenuOpen} />
            </button>

            {isDriverMenuOpen && (
              <div
                role="listbox"
                className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#bfd5c5] bg-[#f7fcf8] shadow-lg"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedDriver === ""}
                  className={`dropdown-option ${selectedDriver === "" ? "dropdown-option-selected" : ""}`}
                  onClick={() => onSelectDriver("")}
                >
                  -- Choose a Driver --
                </button>
                <div className="max-h-56 overflow-y-auto">
                  {filteredDrivers.length === 0 ? (
                    <p className="px-3 py-3 text-sm italic text-[#5c7165]">No drivers available yet.</p>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <button
                        key={driver.id}
                        type="button"
                        role="option"
                        aria-selected={selectedDriver === driver.id}
                        className={`dropdown-option ${selectedDriver === driver.id ? "dropdown-option-selected" : ""}`}
                        onClick={() => onSelectDriver(driver.id)}
                      >
                        {getDriverDisplayName(driver)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

            <div className="mb-5 border-y border-[#dde8e0] py-3 text-sm font-semibold text-[#3f5b4b]">
              Selected Bins: {selectedBins.length}
            </div>

            <button
              onClick={onCreateRoute}
              disabled={isCreatingRoute || selectedBins.length === 0}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreatingRoute ? "Dispatching Route..." : "Dispatch To Driver"}
            </button>
          </div>

          <div className="rounded-2xl border-l-4 border-[#244734] bg-[#f4f7f5] p-5">
            <h3 className="mb-4 text-lg font-extrabold text-[#1f412f]">Change Conditions</h3>
            <div className="mb-5 border-y border-[#dde8e0] py-3 text-sm font-semibold text-[#3f5b4b]">
              Selected Bins: {selectedBins.length}
            </div>
            <div className="flex flex-col gap-2">
              {conditionStatusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onUpdateSelectedBinsConditionStatus(option.value)}
                  disabled={selectedBins.length === 0 || isUpdatingBins}
                  className="rounded-xl border border-[#dde8e0] bg-white px-4 py-2 text-sm font-semibold text-[#244734] transition-colors hover:bg-[#eaf1ec] hover:border-[#b4c9bb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingBins ? "Updating..." : option.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
