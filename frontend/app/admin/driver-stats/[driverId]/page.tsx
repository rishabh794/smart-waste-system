"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DriverStats from "@/components/driver/DriverStats";
import { apiFetch } from "@/lib/apiFetch";

interface DriverDirectoryEntry {
  id: string;
  name: string;
  email: string;
}

const ADMIN_ROLES = ["admin"];

const fetchDrivers = async (url: string): Promise<DriverDirectoryEntry[]> => {
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch drivers");
  }
  return res.json() as Promise<DriverDirectoryEntry[]>;
};

export default function AdminDriverStatsDetailPage() {
  const params = useParams<{ driverId: string }>();
  const driverId = params?.driverId ?? "";

  const {
    data: drivers = [],
    error: driversError,
    isLoading: isDriversLoading,
  } = useSWR<DriverDirectoryEntry[]>(
    "/api/users/drivers",
    fetchDrivers
  );

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === driverId),
    [drivers, driverId]
  );

  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      {() => (
        <div className="site-container page-shell">
          <div className="mb-7 border-b border-[#e5ede7] pb-5">
            <p className="section-eyebrow">Driver Insights</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Driver Performance</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#607267]">
              {isDriversLoading
                ? "Loading driver profile..."
                : selectedDriver
                  ? `${selectedDriver.name} - ${selectedDriver.email}`
                  : "Viewing selected driver statistics."}
            </p>
            <div className="mt-4">
              <Link href="/admin/driver-stats" className="btn-secondary">
                Back To Driver List
              </Link>
            </div>
          </div>

          {driversError && (
            <div className="mb-6 rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
              Unable to load driver profile details right now.
            </div>
          )}

          {driverId ? (
            <DriverStats driverId={driverId} />
          ) : (
            <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
              Missing driver id.
            </div>
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}
