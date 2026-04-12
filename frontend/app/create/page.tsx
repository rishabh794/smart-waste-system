"use client";

import AdminDashboard from "../../components/admin/AdminDashboard";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

const ADMIN_ROLES = ["admin"];

export default function CreatePage() {
  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      {() => (
        <div className="p-4 max-w-4xl mx-auto">
          <AdminDashboard section="create" />
        </div>
      )}
    </ProtectedRoute>
  );
}