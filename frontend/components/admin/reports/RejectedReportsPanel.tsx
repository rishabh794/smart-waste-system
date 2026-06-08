"use client";

import { useEffect, useState } from "react";
import AdminReportSummaryCard from "@/components/admin/reports/AdminReportSummaryCard";
import ReportSlideOver from "@/components/admin/reports/ReportSlideOver";
import { COLUMN_PAGE_SIZE, paginateReports } from "@/lib/adminReports";
import type { AdminReport } from "@/types/CitizenTypes";

interface RejectedReportsPanelProps {
  isOpen: boolean;
  reports: AdminReport[];
  selectedReportId: string | null;
  onClose: () => void;
  onSelectReport: (reportId: string) => void;
}

export default function RejectedReportsPanel({
  isOpen,
  reports,
  selectedReportId,
  onClose,
  onSelectReport,
}: RejectedReportsPanelProps) {
  const [visibleCount, setVisibleCount] = useState(COLUMN_PAGE_SIZE);
  const { visible, hasMore, remaining } = paginateReports(reports, visibleCount);

  useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(COLUMN_PAGE_SIZE);
  }, [isOpen, reports]);

  return (
    <ReportSlideOver
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Rejected"
      title="Rejected Reports"
      ariaLabel="Close rejected reports panel"
    >
      {reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#cddbd2] bg-[#fcfffd] p-5 text-sm italic text-[#5c7165]">
          No rejected reports yet.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((report) => (
            <AdminReportSummaryCard
              key={report.id}
              report={report}
              isSelected={selectedReportId === report.id}
              onSelect={onSelectReport}
            />
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + COLUMN_PAGE_SIZE)}
              className="btn-secondary w-full"
            >
              Load more ({remaining} remaining)
            </button>
          )}
        </div>
      )}
    </ReportSlideOver>
  );
}
