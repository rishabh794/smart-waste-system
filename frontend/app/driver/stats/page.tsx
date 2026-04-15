"use client";

import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import DriverStats from "../../../components/driver/DriverStats";

const DRIVER_ROLES = ["driver"];

export default function DriverStatsPage() {
  return (
    <ProtectedRoute allowedRoles={DRIVER_ROLES}>
      {(session) => (
        <div className="site-container page-shell">
          <div className="mb-7 border-b border-[#e5ede7] pb-5">
            <p className="section-eyebrow">Driver Insights</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">My Collection Stats</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#607267]">
              Review your completed routes, bin health, and weekly pickup velocity.
            </p>
          </div>

          <DriverStats driverId={session.user?.id as string} />
        </div>
      )}
    </ProtectedRoute>
  );
}
