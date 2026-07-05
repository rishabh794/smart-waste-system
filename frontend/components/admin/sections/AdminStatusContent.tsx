"use client";

import DataLoadingState from "@/components/ui/DataLoadingState";
import DropdownField from "@/components/ui/DropdownField";
import type { City, PendingRoute } from "@/types/AdminTypes";

interface AdminStatusContentProps {
  pendingRoutes: PendingRoute[];
  isPendingRoutesLoading: boolean;
  pendingRoutesError: unknown;
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
}

const formatAssignedDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function AdminStatusContent({
  pendingRoutes,
  isPendingRoutesLoading,
  pendingRoutesError,
  cities,
  selectedCityId,
  onCityChange,
}: AdminStatusContentProps) {
  const cityOptions = [
    { value: "", label: "All Cities" },
    ...cities.map((city) => ({ value: city.id, label: city.name })),
  ];

  return (
    <section>
      <div className="mb-4 w-full sm:w-auto sm:max-w-[220px]">
        <DropdownField
          label="Filter by City"
          value={selectedCityId}
          options={cityOptions}
          onChange={onCityChange}
        />
      </div>

      {isPendingRoutesLoading ? (
        <DataLoadingState
          title="Loading active routes"
          subtitle="Fetching the latest route progress from dispatch."
        />
      ) : pendingRoutesError ? (
        <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
          Unable to load active routes right now. Please try again.
        </div>
      ) : pendingRoutes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#cddbd2] bg-[#f8fcf9] p-5 text-sm italic text-[#5c7165]">
          {selectedCityId
            ? "No active routes for the selected city."
            : "No active routes currently deployed."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e4ece6] bg-[#fcfffd] shadow-sm">
          <table className="min-w-full divide-y divide-[#e4ece6]">
            <thead className="bg-[#f8fcf9]">
              <tr>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                  Driver
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                  City
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                  Assigned Date
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                  Route
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                  Progress
                </th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
                  State
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3ef] bg-white">
              {pendingRoutes.map((route) => (
                <tr key={route.routeId} className="transition-colors hover:bg-[#f6faf7]">
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-[#1f3b2d]">
                    {route.driverName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-[#3d6b50]">
                    {route.cityName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-[#5a6f63]">
                    {formatAssignedDate(route.assignedDate)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-[#5a6f63]">
                    {route.routeId.substring(0, 8)}...
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-[#2b4a3a]">
                    {route.progress}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-extrabold ${
                        route.isComplete ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {route.isComplete ? "READY TO COMPLETE" : "IN PROGRESS"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
