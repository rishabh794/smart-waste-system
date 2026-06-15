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
import type { ReportAiAnalysis } from "@/types/CitizenTypes";

const passthroughLoader: ImageLoader = ({ src }) => src;

/* ── AI helpers ── */

const SEVERITY_STYLES: Record<string, { className: string; label: string }> = {
  low: { className: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]", label: "Low" },
  medium: { className: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]", label: "Medium" },
  high: { className: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]", label: "High" },
  critical: { className: "bg-[#fce4ec] text-[#c62828] border-[#ef9a9a]", label: "Critical" },
};

function getConfidenceColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function AiAnalysisSection({ analysis }: { analysis: ReportAiAnalysis }) {
  if (analysis.status === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#d5ddd8] bg-[#f0f5f1] px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        </span>
        <span className="text-sm font-medium text-[#4f6158]">AI analysis in progress…</span>
      </div>
    );
  }

  if (analysis.status === "failed") {
    return (
      <div className="rounded-lg border border-[#e4ddd5] bg-[#faf6f1] px-4 py-3">
        <span className="text-sm text-[#8a7d72]">⚠️ AI analysis unavailable</span>
        {analysis.reason && (
          <p className="mt-1 text-xs text-[#a09486]">{analysis.reason}</p>
        )}
      </div>
    );
  }

  // status === 'completed'
  const confidence = analysis.confidenceScore ?? 0;
  const severityMeta = SEVERITY_STYLES[analysis.severity ?? "low"] ?? SEVERITY_STYLES.low;

  return (
    <div className="space-y-3 rounded-xl border border-[#d5ddd8] bg-[#f6faf7] p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-[0.16em] text-[#3d5347]">
          AI Analysis
        </h4>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            analysis.isValidReport
              ? "bg-[#dcfce7] text-[#166534]"
              : "bg-[#fce4ec] text-[#c62828]"
          }`}
        >
          {analysis.isValidReport ? "✓ Valid Report" : "✗ Not Valid"}
        </span>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#4f6158]">Confidence</span>
          <span className="text-xs font-bold" style={{ color: getConfidenceColor(confidence) }}>
            {confidence}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e4ece6]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${confidence}%`,
              backgroundColor: getConfidenceColor(confidence),
            }}
          />
        </div>
      </div>

      {/* Severity + Category */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${severityMeta.className}`}
        >
          {severityMeta.label} Severity
        </span>
        {analysis.category && (
          <span className="rounded-full border border-[#c5d4ca] bg-[#e8f0eb] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#2d5f3e]">
            {analysis.category}
          </span>
        )}
      </div>

      {/* Reason */}
      {analysis.reason && (
        <p className="text-sm leading-relaxed text-[#4f6158]">{analysis.reason}</p>
      )}
    </div>
  );
}

/* ── Main Panel ── */

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

        {/* AI Analysis Section */}
        {report.aiAnalysis && <AiAnalysisSection analysis={report.aiAnalysis} />}

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

