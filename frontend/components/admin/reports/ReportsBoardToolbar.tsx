"use client";

import DropdownField from "@/components/ui/DropdownField";
import type { ReportCategoryFilter, ReportSortOrder, ReportsBoardFilters } from "@/lib/adminReports";

const CATEGORY_OPTIONS: Array<{ value: ReportCategoryFilter; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "overflowing", label: "Overflowing" },
  { value: "damaged", label: "Damaged" },
  { value: "missed_pickup", label: "Missed pickup" },
  { value: "illegal_dumping", label: "Illegal dumping" },
  { value: "general", label: "General" },
];

const SORT_OPTIONS: Array<{ value: ReportSortOrder; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

interface ReportsBoardToolbarProps {
  filters: ReportsBoardFilters;
  resultCount: number;
  onChange: (filters: ReportsBoardFilters) => void;
}

export default function ReportsBoardToolbar({
  filters,
  resultCount,
  onChange,
}: ReportsBoardToolbarProps) {
  const updateFilter = <K extends keyof ReportsBoardFilters>(
    key: K,
    value: ReportsBoardFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section className="soft-surface rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-[#21412f]">Search</label>
            <input
              type="search"
              className="input-clean"
              placeholder="Title, reporter, address..."
              value={filters.searchQuery}
              onChange={(event) => updateFilter("searchQuery", event.target.value)}
            />
          </div>

          <DropdownField
            label="Category"
            value={filters.category}
            options={CATEGORY_OPTIONS}
            onChange={(value) => updateFilter("category", value)}
          />

          <DropdownField
            label="Sort"
            value={filters.sortOrder}
            options={SORT_OPTIONS}
            onChange={(value) => updateFilter("sortOrder", value)}
          />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#607267]">
          {resultCount} matching
        </p>
      </div>
    </section>
  );
}
