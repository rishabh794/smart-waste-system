"use client";

import type { RefObject } from "react";
import dynamic from "next/dynamic";
import { ChevronIcon } from "@/components/ui/icons";
import type { Bin, Driver } from "@/types/AdminTypes";

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
  selectedBins: string[];
  selectedDriver: string;
  selectedDriverName: string;
  isDriverMenuOpen: boolean;
  isCreatingRoute: boolean;
  driverMenuRef: RefObject<HTMLDivElement | null>;
  onToggleDriverMenu: () => void;
  onToggleBinSelection: (binId: string) => void;
  onSelectDriver: (driverId: string) => void;
  onCreateRoute: () => void;
}

export default function AdminDashboardContent({
  bins,
  drivers,
  selectedBins,
  selectedDriver,
  selectedDriverName,
  isDriverMenuOpen,
  isCreatingRoute,
  driverMenuRef,
  onToggleDriverMenu,
  onToggleBinSelection,
  onSelectDriver,
  onCreateRoute,
}: AdminDashboardContentProps) {
  return (
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
              {bins.length === 0 ? (
                <li className="px-4 py-4 text-sm italic text-[#5c7165]">
                  No bins available yet. Register bins from the Create page.
                </li>
              ) : (
                bins.map((bin) => (
                  <li
                    key={bin.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm odd:bg-[#fcfffd] even:bg-[#f6fbf8]"
                  >
                    <div>
                      <input
                        type="checkbox"
                        className="mr-3 accent-[#1a7b3a]"
                        checked={selectedBins.includes(bin.id)}
                        onChange={() => onToggleBinSelection(bin.id)}
                        disabled={bin.status === "ASSIGNED_TODAY"}
                      />
                      <span className="font-semibold text-[#244734]">
                        Bin #{bin.id.substring(0, 6)} | Zone: {bin.zone}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-extrabold uppercase ${
                        bin.status === "collected"
                          ? "bg-green-100 text-green-700"
                          : bin.status === "overflowing"
                            ? "bg-red-100 text-red-700"
                            : bin.status === "ASSIGNED_TODAY"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {bin.status === "ASSIGNED_TODAY" ? "ON ROUTE" : bin.status || "UNASSIGNED"}
                    </span>
                  </li>
                ))
              )}
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
              onClick={onToggleDriverMenu}
              className={`dropdown-clean ${isDriverMenuOpen ? "dropdown-clean-open" : ""}`}
            >
              <span className={selectedDriver ? "text-[#1f3b2d]" : "text-[#4f6759]"}>
                {selectedDriverName}
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
                  {drivers.length === 0 ? (
                    <p className="px-3 py-3 text-sm italic text-[#5c7165]">No drivers available yet.</p>
                  ) : (
                    drivers.map((driver) => (
                      <button
                        key={driver.id}
                        type="button"
                        role="option"
                        aria-selected={selectedDriver === driver.id}
                        className={`dropdown-option ${selectedDriver === driver.id ? "dropdown-option-selected" : ""}`}
                        onClick={() => onSelectDriver(driver.id)}
                      >
                        {driver.name}
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
            disabled={isCreatingRoute}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreatingRoute ? "Dispatching Route..." : "Dispatch To Driver"}
          </button>
        </aside>
      </section>
    </>
  );
}
