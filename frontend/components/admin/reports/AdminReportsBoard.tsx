"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import ReportsBoardToolbar from "@/components/admin/reports/ReportsBoardToolbar";
import ReportsStatusColumn from "@/components/admin/reports/ReportsStatusColumn";
import {
  BOARD_COLUMN_STATUSES,
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
  selectedReportId: string | null;
  onSelectReport: (reportId: string) => void;
  onReportUpdated: () => void;
}

export default function AdminReportsBoard({ 
  reports, 
  selectedReportId,
  onSelectReport,
  onReportUpdated 
}: AdminReportsBoardProps) {
  const groupedReports = useMemo(() => groupReportsForBoard(reports), [reports]);

  const handleReportUpdated = () => {
    onReportUpdated();
  };

  return (
    <>
      <div className="space-y-6">
          <ReportBoardMap
            reports={reports}
            selectedReportId={selectedReportId}
            onReportSelect={onSelectReport}
          />

          <div className="-mx-1 overflow-x-auto px-1 pb-2">
            <div className="flex min-w-max gap-4 lg:grid lg:min-w-0 lg:grid-cols-3">
              {BOARD_COLUMN_STATUSES.map((status) => (
                <ReportsStatusColumn
                  key={status}
                  status={status}
                  reports={groupedReports[status]}
                  selectedReportId={selectedReportId}
                  onSelectReport={onSelectReport}
                />
              ))}
            </div>
          </div>
      </div>

    </>
  );
}
