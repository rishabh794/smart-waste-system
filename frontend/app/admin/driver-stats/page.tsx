"use client";

import Link from "next/link";
import useSWR from "swr";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { apiFetch } from "@/lib/apiFetch";

interface DriverCardData {
  id: string;
  name: string;
  email: string;
}

const ADMIN_ROLES = ["admin"];

const fetchDrivers = async (url: string): Promise<DriverCardData[]> => {
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch drivers");
  }
  return res.json() as Promise<DriverCardData[]>;
};

export default function AdminDriverStatsDirectoryPage() {
  const { data: drivers = [], error, isLoading } = useSWR<DriverCardData[]>(
    "/api/users/drivers",
    fetchDrivers
  );

  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      {() => (
        <div className="site-container page-shell">
          <div className="mb-7 border-b border-[#e5ede7] pb-5">
            <p className="section-eyebrow">Driver Insights</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Driver Stats</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#607267]">
              Select a driver to view their route completion, bin health, and weekly velocity.
            </p>
          </div>

          {isLoading && (
            <div className="soft-surface p-6 text-center text-sm font-semibold text-[#315242]">
              Loading drivers...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
              Unable to load drivers right now. Please try again.
            </div>
          )}

          {!isLoading && !error && drivers.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#cddbd2] bg-[#f8fcf9] p-5 text-sm italic text-[#5c7165]">
              No drivers found. Add a driver from the Create page to view stats.
            </div>
          )}

          {!isLoading && !error && drivers.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {drivers.map((driver) => (
                <Link
                  key={driver.id}
                  href={`/admin/driver-stats/${driver.id}`}
                  className="group rounded-2xl border border-[#dce9e1] bg-[#fcfffd] p-5 transition hover:border-[#b9d8c5] hover:bg-[#f6fbf8]"
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#1a7b3a]">
                    Driver Profile
                  </p>
                  <h3 className="mt-2 text-lg font-extrabold text-[#1f412f]">{driver.name}</h3>
                  <p className="mt-1 text-sm text-[#607267]">{driver.email}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#2d5a43] transition group-hover:text-[#1a7b3a]">
                    View Stats
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}
