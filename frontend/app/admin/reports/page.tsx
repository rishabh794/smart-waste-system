"use client";

import { useState } from "react";
import useSWR from "swr";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminReportsBoard from "@/components/admin/reports/AdminReportsBoard";
import AdminReportsTable from "@/components/admin/reports/AdminReportsTable";
import ReportDetailPanel from "@/components/admin/reports/ReportDetailPanel";
import ReportsBoardToolbar from "@/components/admin/reports/ReportsBoardToolbar";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { ADMIN_REPORTS_KEY, fetchAllReports } from "@/lib/services/reportService";
import { DEFAULT_BOARD_FILTERS } from "@/lib/adminReports";
import type { AdminReport, PaginatedResponse } from "@/types/CitizenTypes";

const ADMIN_ROLES = ["admin"];

export default function AdminReportsPage() {
  const [view, setView] = useState<"board" | "table" | "rejected">("board");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_BOARD_FILTERS);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleViewChange = (newView: "board" | "table" | "rejected") => {
    setView(newView);
    setCurrentPage(1);
  };

  const getQueryString = (baseLimit: number, baseStatus: string) => {
    const params = new URLSearchParams();
    params.set("limit", baseLimit.toString());
    params.set("status", baseStatus);
    if (currentPage > 1 && view !== "board") params.set("page", currentPage.toString());
    if (filters.searchQuery) params.set("search", filters.searchQuery);
    if (filters.category && filters.category !== "all") params.set("category", filters.category);
    if (filters.sortOrder) params.set("sort", filters.sortOrder);
    return params.toString();
  };

  // SWR for Board View (fetch recent 200)
  const {
    data: boardResponse,
    error: boardError,
    isLoading: isBoardLoading,
    mutate: mutateBoard,
  } = useSWR<PaginatedResponse<AdminReport[]>>(
    view === "board" ? `${ADMIN_REPORTS_KEY}?${getQueryString(200, "submitted,in_review,resolved")}` : null,
    fetchAllReports,
    { revalidateOnFocus: false }
  );

  // SWR for Table View (paginated)
  const {
    data: tableResponse,
    error: tableError,
    isLoading: isTableLoading,
    mutate: mutateTable,
  } = useSWR<PaginatedResponse<AdminReport[]>>(
    view === "table" ? `${ADMIN_REPORTS_KEY}?${getQueryString(20, "submitted,in_review,resolved")}` : null,
    fetchAllReports,
    { revalidateOnFocus: false }
  );

  // SWR for Rejected Reports (paginated)
  const {
    data: rejectedResponse,
    error: rejectedError,
    isLoading: isRejectedLoading,
    mutate: mutateRejected,
  } = useSWR<PaginatedResponse<AdminReport[]>>(
    view === "rejected" ? `${ADMIN_REPORTS_KEY}?${getQueryString(20, "rejected")}` : null,
    fetchAllReports,
    { revalidateOnFocus: false }
  );

  const handleReportUpdated = () => {
    if (view === "board") mutateBoard();
    if (view === "table") mutateTable();
    if (view === "rejected") mutateRejected();
  };

  const currentError = view === "board" ? boardError : view === "table" ? tableError : rejectedError;
  const currentIsLoading = view === "board" ? isBoardLoading : view === "table" ? isTableLoading : isRejectedLoading;

  const allReports = [
    ...(boardResponse?.data || []),
    ...(tableResponse?.data || []),
    ...(rejectedResponse?.data || []),
  ];
  const selectedReport = allReports.find((r) => r.id === selectedReportId) ?? null;

  // Get total count for the toolbar
  let resultCount = 0;
  if (view === "board" && boardResponse) resultCount = boardResponse.pagination.total;
  if (view === "table" && tableResponse) resultCount = tableResponse.pagination.total;
  if (view === "rejected" && rejectedResponse) resultCount = rejectedResponse.pagination.total;

  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      {() => (
        <div className="site-container page-shell">
          <div className="mb-6 border-b border-[#e5ede7] pb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Citizen Submissions</p>
              <h1 className="mt-2 text-2xl font-extrabold text-[#1b2a22] sm:text-3xl">Issue Reports</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607267]">
                Review citizen-reported bin issues, triage by status, and leave notes for resolution tracking.
              </p>
            </div>
            
            <div className="flex flex-wrap bg-[#f6faf7] p-1 rounded-lg border border-[#e4ece6]">
              <button
                onClick={() => handleViewChange("board")}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                  view === "board"
                    ? "bg-white text-[#1a6a3a] shadow-sm border border-[#dce9e1]"
                    : "text-[#607267] hover:text-[#1d3025]"
                }`}
              >
                Board View
              </button>
              <button
                onClick={() => handleViewChange("table")}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                  view === "table"
                    ? "bg-white text-[#1a6a3a] shadow-sm border border-[#dce9e1]"
                    : "text-[#607267] hover:text-[#1d3025]"
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => handleViewChange("rejected")}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
                  view === "rejected"
                    ? "bg-white text-[#1a6a3a] shadow-sm border border-[#dce9e1]"
                    : "text-[#607267] hover:text-[#1d3025]"
                }`}
              >
                Rejected Reports
              </button>
            </div>
          </div>

          <div className="mb-6">
            <ReportsBoardToolbar
              filters={filters}
              resultCount={resultCount}
              onChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentPage(1); // Reset page on filter change
              }}
            />
          </div>

          {currentIsLoading && (
            <DataLoadingState
              title="Loading reports"
              subtitle="Fetching citizen submissions and current statuses."
            />
          )}

          {currentError && (
            <div className="rounded-xl border border-[#f1caca] bg-[#fff4f3] p-4 text-sm font-semibold text-[#8d2e2b]">
              Unable to load reports right now. Please try again.
            </div>
          )}

          {!currentIsLoading && !currentError && view === "board" && boardResponse && (
            <AdminReportsBoard 
              reports={boardResponse.data} 
              selectedReportId={selectedReportId}
              onSelectReport={setSelectedReportId}
              onReportUpdated={handleReportUpdated} 
            />
          )}

          {!currentIsLoading && !currentError && view === "table" && tableResponse && (
            <AdminReportsTable 
              reportsResponse={tableResponse} 
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onSelectReport={setSelectedReportId}
            />
          )}

          {!currentIsLoading && !currentError && view === "rejected" && rejectedResponse && (
            <AdminReportsTable 
              reportsResponse={rejectedResponse} 
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onSelectReport={setSelectedReportId}
            />
          )}

          <ReportDetailPanel
            report={selectedReport}
            onClose={() => setSelectedReportId(null)}
            onUpdated={handleReportUpdated}
          />
        </div>
      )}
    </ProtectedRoute>
  );
}
