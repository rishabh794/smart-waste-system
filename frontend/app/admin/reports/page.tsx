"use client";

import useSWR from "swr";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminReportsBoard from "@/components/admin/reports/AdminReportsBoard";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { ADMIN_REPORTS_KEY, fetchAllReports } from "@/lib/services/reportService";
import type { AdminReport } from "@/types/CitizenTypes";

const ADMIN_ROLES = ["admin"];

export default function AdminReportsPage() {
  const {
    data: reports,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminReport[]>(ADMIN_REPORTS_KEY, fetchAllReports, {
    revalidateOnFocus: false,
  });

  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      {() => (
        <div className="site-container page-shell">
          {isLoading && !reports && (
            <>
              <div className="mb-6 border-b border-[#e5ede7] pb-5 sm:mb-7">
                <p className="section-eyebrow">Citizen Submissions</p>
                <h1 className="mt-2 text-2xl font-extrabold text-[#1b2a22] sm:text-3xl">Issue Reports</h1>
              </div>
              <DataLoadingState
                title="Loading reports"
                subtitle="Fetching citizen submissions and current statuses."
              />
            </>
          )}

          {error && (
            <>
              <div className="mb-6 border-b border-[#e5ede7] pb-5 sm:mb-7">
                <p className="section-eyebrow">Citizen Submissions</p>
                <h1 className="mt-2 text-2xl font-extrabold text-[#1b2a22] sm:text-3xl">Issue Reports</h1>
              </div>
              <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
                Unable to load reports right now. Please try again.
              </div>
            </>
          )}

          {!isLoading && !error && reports?.length === 0 && (
            <>
              <div className="mb-6 border-b border-[#e5ede7] pb-5 sm:mb-7">
                <p className="section-eyebrow">Citizen Submissions</p>
                <h1 className="mt-2 text-2xl font-extrabold text-[#1b2a22] sm:text-3xl">Issue Reports</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607267]">
                  Review citizen-reported bin issues, triage by status, and leave notes for resolution tracking.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-[#cddbd2] bg-[#f8fcf9] p-5 text-sm italic text-[#5c7165]">
                No citizen reports have been submitted yet.
              </div>
            </>
          )}

          {!isLoading && !error && reports && reports.length > 0 && (
            <AdminReportsBoard reports={reports} onReportUpdated={() => mutate()} />
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}
