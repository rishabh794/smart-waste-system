"use client";

import Link from "next/link";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import DriverStats from "../../../components/driver/DriverStats";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";

const DRIVER_ROLES = ["driver"];

export default function DriverStatsPage() {
  return (
    <ProtectedRoute allowedRoles={DRIVER_ROLES}>
      {(session) => (
        <div className="site-container page-shell">
          <DashboardPageHeader
            eyebrow="Driver Insights"
            title="My Collection Stats"
            description="Review your completed routes, bin health, and weekly pickup velocity."
            actions={
              <Link href="/dashboard" className="btn-secondary">
                Back to Route
              </Link>
            }
          />
          <DriverStats driverId={session.user?.id as string} />
        </div>
      )}
    </ProtectedRoute>
  );
}
