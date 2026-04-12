"use client";

import AdminDashboard from "../../components/admin/AdminDashboard";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

const ADMIN_ROLES = ["admin"];

export default function CreatePage() {
  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      {() => (
        <div className="site-container page-shell">
          <div className="mb-7 border-b border-[#e5ede7] pb-5">
            <p className="section-eyebrow">Resource Management</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Create Bins And Drivers</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#607267]">Register operational assets to expand route coverage.</p>
          </div>
          <AdminDashboard section="create" />
        </div>
      )}
    </ProtectedRoute>
  );
}