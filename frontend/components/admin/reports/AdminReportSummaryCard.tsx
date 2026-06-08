"use client";

import Image, { type ImageLoader } from "next/image";
import { formatReportCategory, formatReportDateTime } from "@/lib/reportDisplay";
import type { AdminReport } from "@/types/CitizenTypes";

const passthroughLoader: ImageLoader = ({ src }) => src;

interface AdminReportSummaryCardProps {
  report: AdminReport;
  isSelected?: boolean;
  onSelect: (reportId: string) => void;
}

export default function AdminReportSummaryCard({
  report,
  isSelected = false,
  onSelect,
}: AdminReportSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      className={`w-full rounded-xl border p-3 text-left shadow-sm transition hover:border-[#b9d8c5] hover:bg-[#f6fbf8] ${
        isSelected
          ? "border-[#1a7b3a] bg-[#eef8f1] ring-1 ring-[#1a7b3a]/20"
          : "border-[#dce9e1] bg-[#fcfffd]"
      }`}
    >
      <div className="flex gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-1 text-sm font-extrabold text-[#1d3025]">{report.title}</h3>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#1a7b3a]">
            {formatReportCategory(report.category)}
          </p>
          <p className="line-clamp-1 text-xs text-[#607267]">{report.reportedBy}</p>
          <p className="text-[0.68rem] text-[#8a9a90]">{formatReportDateTime(report.createdAt)}</p>
        </div>

        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#e4ece6] bg-[#f6faf7]">
          <Image
            loader={passthroughLoader}
            src={report.imageUrl}
            alt={`Report ${report.title}`}
            width={112}
            height={112}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      </div>
    </button>
  );
}
