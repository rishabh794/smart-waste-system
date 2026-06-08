"use client";

import { useEffect, useState } from "react";
import AdminReportSummaryCard from "@/components/admin/reports/AdminReportSummaryCard";
import { COLUMN_PAGE_SIZE, paginateReports } from "@/lib/adminReports";
import { STATUS_STYLES } from "@/lib/reportDisplay";
import type { BoardColumnStatus } from "@/lib/adminReports";
import type { AdminReport } from "@/types/CitizenTypes";

interface ReportsStatusColumnProps {
  status: BoardColumnStatus;
  reports: AdminReport[];
  selectedReportId: string | null;
  onSelectReport: (reportId: string) => void;
}

export default function ReportsStatusColumn({
  status,
  reports,
  selectedReportId,
  onSelectReport,
}: ReportsStatusColumnProps) {
  const [visibleCount, setVisibleCount] = useState(COLUMN_PAGE_SIZE);
  const statusMeta = STATUS_STYLES[status];
  const { visible, hasMore, remaining } = paginateReports(reports, visibleCount);

  useEffect(() => {
    setVisibleCount(COLUMN_PAGE_SIZE);
  }, [reports]);

  return (
    <section className="flex min-w-[280px] flex-1 flex-col rounded-2xl border border-[#dce9e1] bg-[#f8fcf9] sm:min-w-[300px]">
      <header className="flex items-center justify-between border-b border-[#e6efe9] px-4 py-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#607267]">
          {reports.length}
        </span>
      </header>

      <div className="flex max-h-[min(520px,calc(100vh-24rem))] flex-col gap-2 overflow-y-auto p-3">
        {reports.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#cddbd2] bg-[#fcfffd] p-4 text-center text-xs italic text-[#5c7165]">
            No {statusMeta.label.toLowerCase()} reports.
          </p>
        ) : (
          visible.map((report) => (
            <AdminReportSummaryCard
              key={report.id}
              report={report}
              isSelected={selectedReportId === report.id}
              onSelect={onSelectReport}
            />
          ))
        )}
      </div>

      {hasMore && (
        <footer className="border-t border-[#e6efe9] p-3">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + COLUMN_PAGE_SIZE)}
            className="btn-secondary w-full"
          >
            Load more ({remaining} remaining)
          </button>
        </footer>
      )}
    </section>
  );
}
