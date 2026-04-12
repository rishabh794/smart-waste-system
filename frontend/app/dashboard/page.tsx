"use client";

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
            <DriverDashboard userId={session.user?.id as string} />
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}