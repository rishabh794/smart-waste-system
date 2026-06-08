"use client";

import Image, { type ImageLoader } from "next/image";
import AdminReportDetailForm from "@/components/admin/reports/AdminReportDetailForm";
import ReportSlideOver from "@/components/admin/reports/ReportSlideOver";
import {
  formatReportCategory,
  formatReportDateTime,
  STATUS_STYLES,
} from "@/lib/reportDisplay";
import type { AdminReport } from "@/types/CitizenTypes";

const passthroughLoader: ImageLoader = ({ src }) => src;

interface ReportDetailPanelProps {
  report: AdminReport | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ReportDetailPanel({ report, onClose, onUpdated }: ReportDetailPanelProps) {
  if (!report) return null;

  const statusMeta = STATUS_STYLES[report.status];

  return (
    <ReportSlideOver
      isOpen={Boolean(report)}
      onClose={onClose}
      eyebrow="Report Detail"
      title={report.title}
      layer="top"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[#1a7b3a]">
            {formatReportCategory(report.category)}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e4ece6] bg-[#f6faf7]">
          <Image
            loader={passthroughLoader}
            src={report.imageUrl}
            alt={`Report ${report.title}`}
            width={640}
            height={384}
            className="h-48 w-full object-cover"
            unoptimized
          />
        </div>

        <div className="space-y-2 text-sm text-[#4f6158]">
          <p>{report.description}</p>
          <p>
            <span className="font-semibold text-[#1d3025]">Reporter:</span> {report.reportedBy}
          </p>
          <p className="text-xs text-[#607267]">{report.reporterEmail}</p>
          <p>
            <span className="font-semibold text-[#1d3025]">Location:</span>{" "}
            {report.address?.trim() || "Address not provided"}
          </p>
          <p className="text-xs text-[#6a7d72]">
            Lat {report.latitude}, Lng {report.longitude}
          </p>
          {report.binId && (
            <p className="text-xs text-[#6a7d72]">
              Bin ID: <span className="font-semibold text-[#2d3f36]">{report.binId}</span>
            </p>
          )}
          <p className="text-xs text-[#607267]">
            Submitted {formatReportDateTime(report.createdAt)} · Updated{" "}
            {formatReportDateTime(report.updatedAt)}
          </p>
          {report.resolvedByName && (
            <p className="text-xs text-[#607267]">
              Resolved by {report.resolvedByName} on {formatReportDateTime(report.resolvedAt)}
            </p>
          )}
        </div>

        <AdminReportDetailForm report={report} onUpdated={onUpdated} />
      </div>
    </ReportSlideOver>
  );
}
