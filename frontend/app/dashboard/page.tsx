"use client";

import Link from "next/link";
import AdminDashboard from "../../components/admin/AdminDashboard";
import DriverDashboard from "../../components/driver/DriverDashboard";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {(session) => (
        <div className="site-container page-shell">
          <div className="mb-7 border-b border-[#e5ede7] pb-5">
            <p className="section-eyebrow">Operations Console</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">
              {session.user?.role === "admin" ? "Admin Command Center" : "Driver Daily Route"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#607267]">
              Monitor collection progress, update statuses, and keep routes synchronized in real time.
            </p>
          </div>

          {session.user?.role === "admin" ? (
            <AdminDashboard section="dashboard" />
          ) : (
            <div className="space-y-4">
              <div className="soft-surface flex flex-col items-start justify-between gap-3 rounded-xl border-[#dce9e1] bg-[#fcfffd] p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1a7b3a]">Performance</p>
                  <p className="mt-1 text-sm text-[#607267]">Track your route efficiency, serviced bins, and weekly progress.</p>
                </div>
                <Link href="/driver/stats" className="btn-secondary">
                  My Stats
                </Link>
              </div>

              <DriverDashboard userId={session.user?.id as string} />
            </div>
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}