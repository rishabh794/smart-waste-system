"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import RejectedReportsPanel from "@/components/admin/reports/RejectedReportsPanel";
import ReportDetailPanel from "@/components/admin/reports/ReportDetailPanel";
import ReportsBoardToolbar from "@/components/admin/reports/ReportsBoardToolbar";
import ReportsStatusColumn from "@/components/admin/reports/ReportsStatusColumn";
import {
  BOARD_COLUMN_STATUSES,
  DEFAULT_BOARD_FILTERS,
  filterReports,
  getPendingReportCount,
  groupReportsForBoard,
} from "@/lib/adminReports";
import type { AdminReport } from "@/types/CitizenTypes";

const ReportBoardMap = dynamic(() => import("@/components/admin/reports/ReportBoardMap"), {
  ssr: false,
  loading: () => (
    <div className="soft-surface flex h-72 items-center justify-center rounded-2xl text-sm text-[#607267] sm:h-80">
      Loading map...
    </div>
  ),
});

interface AdminReportsBoardProps {
  reports: AdminReport[];
  onReportUpdated: () => void;
}

export default function AdminReportsBoard({ reports, onReportUpdated }: AdminReportsBoardProps) {
  const [filters, setFilters] = useState(DEFAULT_BOARD_FILTERS);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isRejectedPanelOpen, setIsRejectedPanelOpen] = useState(false);

  const filteredReports = useMemo(() => filterReports(reports, filters), [reports, filters]);
  const groupedReports = useMemo(() => groupReportsForBoard(filteredReports), [filteredReports]);
  const activeReports = useMemo(
    () => filteredReports.filter((report) => report.status !== "rejected"),
    [filteredReports]
  );
  const rejectedReports = useMemo(
    () => filterReports(
      reports.filter((report) => report.status === "rejected"),
      filters
    ),
    [reports, filters]
  );

  const pendingCount = getPendingReportCount(reports);
  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const handleReportUpdated = () => {
    onReportUpdated();
  };

  return (
    <>
      <DashboardPageHeader
        eyebrow="Citizen Submissions"
        title="Issue Reports"
        description="Review citizen-reported bin issues, triage by status, and leave notes for resolution tracking."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-[#b6e2c4] bg-[#e9f7ee] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#1a6a3a]">
              {pendingCount} pending
            </div>
            <button
              type="button"
              onClick={() => setIsRejectedPanelOpen(true)}
              className="btn-secondary"
            >
              Rejected Reports ({rejectedReports.length})
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        <ReportsBoardToolbar
          filters={filters}
          resultCount={filteredReports.length}
          onChange={setFilters}
        />

        <ReportBoardMap
          reports={activeReports}
          selectedReportId={selectedReportId}
          onReportSelect={handleSelectReport}
        />

        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-max gap-4 lg:grid lg:min-w-0 lg:grid-cols-3">
            {BOARD_COLUMN_STATUSES.map((status) => (
              <ReportsStatusColumn
                key={status}
                status={status}
                reports={groupedReports[status]}
                selectedReportId={selectedReportId}
                onSelectReport={handleSelectReport}
              />
            ))}
          </div>
        </div>
      </div>

      <RejectedReportsPanel
        isOpen={isRejectedPanelOpen}
        reports={rejectedReports}
        selectedReportId={selectedReportId}
        onClose={() => setIsRejectedPanelOpen(false)}
        onSelectReport={handleSelectReport}
      />

      <ReportDetailPanel
        report={selectedReport}
        onClose={() => setSelectedReportId(null)}
        onUpdated={handleReportUpdated}
      />
    </>
  );
}
