"use client";

import Link from "next/link";
import AdminDashboard from "../../components/admin/AdminDashboard";
import CitizenDashboard from "../../components/citizen/CitizenDashboard";
import DriverDashboard from "../../components/driver/DriverDashboard";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {(session) => {
        const role = session.user?.role;

        if (role === "admin") {
          return (
            <div className="site-container page-shell">
              <DashboardPageHeader
                eyebrow="Operations Console"
                title="Admin Command Center"
                description="Monitor collection progress, update statuses, and keep routes synchronized in real time."
              />
              <AdminDashboard section="dashboard" />
            </div>
          );
        }

        if (role === "driver") {
          return (
            <div className="site-container page-shell">
              <DashboardPageHeader
                eyebrow="Operations Console"
                title="Driver Daily Route"
                description="Review your assigned route, update bin statuses, and close out today's collection run."
                actions={
                  <Link href="/driver/stats" className="btn-secondary">
                    My Stats
                  </Link>
                }
              />
              <DriverDashboard userId={session.user?.id as string} />
            </div>
          );
        }

        return (
          <div className="site-container page-shell">
            <DashboardPageHeader
              eyebrow="Citizen Service"
              title="Citizen Service Desk"
              description="Submit bin issue reports, attach evidence, and follow resolution updates."
              actions={
                <>
                  <Link href="/report" className="btn-primary">
                    Report Issue
                  </Link>
                  <Link href="/reports" className="btn-secondary">
                    My Reports
                  </Link>
                </>
              }
            />
            <CitizenDashboard />
          </div>
        );
      }}
    </ProtectedRoute>
  );
}
