"use client";

import DataLoadingState from "@/components/ui/DataLoadingState";
import type { PendingRoute } from "@/types/AdminTypes";

interface AdminStatusContentProps {
  pendingRoutes: PendingRoute[];
  isPendingRoutesLoading: boolean;
  pendingRoutesError: unknown;
}

export default function AdminStatusContent({
  pendingRoutes,
  isPendingRoutesLoading,
  pendingRoutesError,
}: AdminStatusContentProps) {
  return (
    <section>
      <h3 className="mb-4 text-2xl font-extrabold text-[#1d3026]">Active Operations (Pending Routes)</h3>
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
          No active routes currently deployed.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e4ece6] bg-[#fcfffd]">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_150px] border-b border-[#e6efe9] bg-[#f8fcf9] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#527065]">
            <span>Driver</span>
            <span>Route</span>
            <span>Progress</span>
            <span>State</span>
          </div>
          {pendingRoutes.map((route) => (
            <div
              key={route.routeId}
              className="grid grid-cols-[1.2fr_1fr_1fr_150px] items-center border-b border-[#eef3ef] px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-semibold text-[#1f3b2d]">{route.driverName}</span>
              <span className="text-[#5a6f63]">{route.routeId.substring(0, 8)}...</span>
              <span className="font-semibold text-[#2b4a3a]">{route.progress}</span>
              <span
                className={`w-fit rounded-full px-2 py-1 text-xs font-extrabold ${
                  route.isComplete ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {route.isComplete ? "READY TO COMPLETE" : "IN PROGRESS"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
