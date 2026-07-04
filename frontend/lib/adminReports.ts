import type { AdminReport, ReportCategory, ReportStatus } from "@/types/CitizenTypes";

export const BOARD_COLUMN_STATUSES = ["submitted", "in_review", "resolved"] as const;

export type BoardColumnStatus = (typeof BOARD_COLUMN_STATUSES)[number];

export type GroupedReports = Record<ReportStatus, AdminReport[]>;

export type ReportSortOrder = "newest" | "oldest";

export type ReportCategoryFilter = ReportCategory | "all";

export type ReportSeverityFilter = "low" | "medium" | "high" | "critical" | "all";

export interface ReportsBoardFilters {
  searchQuery: string;
  category: ReportCategoryFilter;
  sortOrder: ReportSortOrder;
  severity: ReportSeverityFilter;
}

export const COLUMN_PAGE_SIZE = 12;

export const DEFAULT_BOARD_FILTERS: ReportsBoardFilters = {
  searchQuery: "",
  category: "all",
  sortOrder: "newest",
  severity: "all",
};

export const groupReportsForBoard = (reports: AdminReport[]): GroupedReports => {
  const grouped: GroupedReports = {
    submitted: [],
    in_review: [],
    resolved: [],
    rejected: [],
  };

  for (const report of reports) {
    grouped[report.status].push(report);
  }

  return grouped;
};


export const paginateReports = (reports: AdminReport[], visibleCount: number) => {
  return {
    visible: reports.slice(0, visibleCount),
    hasMore: reports.length > visibleCount,
    remaining: Math.max(reports.length - visibleCount, 0),
  };
};
