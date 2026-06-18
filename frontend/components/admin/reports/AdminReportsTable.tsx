"use client";

import { formatReportCategory, formatReportDateTime, STATUS_STYLES } from "@/lib/reportDisplay";
import type { AdminReport, PaginatedResponse } from "@/types/CitizenTypes";

interface AdminReportsTableProps {
  reportsResponse: PaginatedResponse<AdminReport[]>;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectReport?: (reportId: string) => void;
}

export default function AdminReportsTable({
  reportsResponse,
  currentPage,
  onPageChange,
  onSelectReport,
}: AdminReportsTableProps) {
  const { data: reports, pagination } = reportsResponse;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-[#e4ece6] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#e4ece6]">
          <thead className="bg-[#f8fcf9]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#607267]">
                Title & Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#607267]">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#607267]">
                Reporter
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#607267]">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4ece6] bg-white">
            {reports.map((report) => {
              const statusMeta = STATUS_STYLES[report.status];
              return (
                <tr 
                  key={report.id} 
                  className={`hover:bg-[#f6faf7] transition-colors ${onSelectReport ? 'cursor-pointer' : ''}`}
                  onClick={() => onSelectReport?.(report.id)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[#1d3025]">{report.title}</div>
                    <div className="text-xs font-medium uppercase tracking-wider text-[#1a7b3a] mt-1">
                      {formatReportCategory(report.category)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.14em] ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#2d3f36]">{report.reportedBy}</div>
                    <div className="text-xs text-[#6a7d72]">{report.reporterEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4f6158]">
                    {formatReportDateTime(report.createdAt)}
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#607267]">
                  No reports found on this page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#e4ece6] pt-6">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-[#4f6158]">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
