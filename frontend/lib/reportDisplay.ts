import type { ReportCategory, ReportStatus } from "@/types/CitizenTypes";

export const STATUS_STYLES: Record<ReportStatus, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className: "border-[#ecd9a8] bg-[#fff7e4] text-[#7d5a13]",
  },
  in_review: {
    label: "In Review",
    className: "border-[#b8d6f2] bg-[#e9f2fb] text-[#1d4d7a]",
  },
  resolved: {
    label: "Resolved",
    className: "border-[#b6e2c4] bg-[#e9f7ee] text-[#1a6a3a]",
  },
  rejected: {
    label: "Rejected",
    className: "border-[#f1c1c1] bg-[#fff1f1] text-[#9b2c2c]",
  },
};

export const STATUS_OPTIONS: Array<{ value: ReportStatus; label: string }> = [
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export const formatReportDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const formatReportCategory = (value: ReportCategory) => {
  return value.replace(/_/g, " ");
};

export const STATUS_MARKER_COLORS: Record<ReportStatus, string> = {
  submitted: "bg-[#eab308]",
  in_review: "bg-[#3b82f6]",
  resolved: "bg-[#22c55e]",
  rejected: "bg-[#ef4444]",
};
