"use client";

import AdminDashboard from "../../components/admin/AdminDashboard";
import DriverDashboard from "../../components/driver/DriverDashboard";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {(session) => (
        <div className="p-4 max-w-4xl mx-auto">
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