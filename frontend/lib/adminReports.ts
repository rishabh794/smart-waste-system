import type { AdminReport, ReportCategory, ReportStatus } from "@/types/CitizenTypes";

export const BOARD_COLUMN_STATUSES = ["submitted", "in_review", "resolved"] as const;

export type BoardColumnStatus = (typeof BOARD_COLUMN_STATUSES)[number];

export type GroupedReports = Record<ReportStatus, AdminReport[]>;

export type ReportSortOrder = "newest" | "oldest";

export type ReportCategoryFilter = ReportCategory | "all";

export interface ReportsBoardFilters {
  searchQuery: string;
  category: ReportCategoryFilter;
  sortOrder: ReportSortOrder;
}

export const COLUMN_PAGE_SIZE = 12;

export const DEFAULT_BOARD_FILTERS: ReportsBoardFilters = {
  searchQuery: "",
  category: "all",
  sortOrder: "newest",
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

export const getActiveBoardReports = (reports: AdminReport[]) => {
  return reports.filter((report) => report.status !== "rejected");
};

export const getPendingReportCount = (reports: AdminReport[]) => {
  return reports.filter((report) => report.status === "submitted" || report.status === "in_review").length;
};

export const filterReports = (reports: AdminReport[], filters: ReportsBoardFilters) => {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = reports.filter((report) => {
    if (filters.category !== "all" && report.category !== filters.category) {
      return false;
    }

    if (!query) return true;

    return (
      report.title.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.reportedBy.toLowerCase().includes(query) ||
      report.reporterEmail.toLowerCase().includes(query) ||
      report.address?.toLowerCase().includes(query) ||
      report.binId?.toLowerCase().includes(query)
    );
  });

  return filtered.sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return filters.sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
  });
};

export const paginateReports = (reports: AdminReport[], visibleCount: number) => {
  return {
    visible: reports.slice(0, visibleCount),
    hasMore: reports.length > visibleCount,
    remaining: Math.max(reports.length - visibleCount, 0),
  };
};
