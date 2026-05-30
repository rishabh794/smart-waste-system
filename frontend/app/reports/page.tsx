"use client";

import Link from "next/link";
import Image, { type ImageLoader } from "next/image";
import useSWR from "swr";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { fetchMyReports, USER_REPORTS_KEY } from "@/lib/services/reportService";
import type { CitizenReport, ReportStatus } from "@/types/CitizenTypes";

const STATUS_STYLES: Record<ReportStatus, { label: string; className: string }> = {
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

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatCategory = (value: CitizenReport["category"]) => {
  return value.replace(/_/g, " ");
};

const passthroughLoader: ImageLoader = ({ src }) => src;

export default function ReportsPage() {
  const {
    data: reports,
    error,
    isLoading,
    mutate,
  } = useSWR<CitizenReport[]>(USER_REPORTS_KEY, fetchMyReports, {
    revalidateOnFocus: false,
  });

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      {() => (
        <div className="site-container page-shell">
          <div className="mb-7 border-b border-[#e5ede7] pb-5">
            <p className="section-eyebrow">Citizen History</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1b2a22]">My Reports</h1>
                <p className="mt-2 max-w-2xl text-sm text-[#607267]">
                  Track every report you have submitted and review resolution updates from the operations team.
                </p>
              </div>
              <Link href="/report" className="btn-primary">
                New Report
              </Link>
            </div>
          </div>

          {isLoading && !reports && (
            <DataLoadingState
              title="Loading reports"
              subtitle="Fetching your submitted issues and statuses."
            />
          )}

          {error && (
            <div className="soft-surface rounded-xl border-[#f1c9c9] bg-[#fff5f5] p-5 text-sm text-[#9b2c2c]">
              <p className="font-semibold">Unable to load reports right now.</p>
              <button
                type="button"
                onClick={() => mutate()}
                className="mt-3 inline-flex items-center text-xs font-bold uppercase tracking-[0.12em] text-[#9b2c2c]"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && reports?.length === 0 && (
            <div className="soft-surface rounded-xl border-[#dce9e1] bg-[#fcfffd] p-6">
              <p className="text-sm text-[#5f7167]">You have not submitted any reports yet.</p>
              <Link href="/report" className="btn-secondary mt-4 inline-flex">
                Submit First Report
              </Link>
            </div>
          )}

          <div className="grid gap-5">
            {reports?.map((report) => {
              const statusMeta = STATUS_STYLES[report.status];

              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-[#e4ece6] bg-white/90 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-extrabold text-[#1d3025]">{report.title}</h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1a7b3a]">
                        {formatCategory(report.category)}
                      </p>
                      <p className="text-sm text-[#5f7167]">{report.description}</p>
                    </div>

                    <div className="text-xs text-[#607267]">
                      <p>
                        <span className="font-semibold text-[#2d3f36]">Submitted:</span> {formatDateTime(report.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[#2d3f36]">Updated:</span> {formatDateTime(report.updatedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[#2d3f36]">Resolved:</span> {formatDateTime(report.resolvedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-[#e4ece6] bg-[#f8fcf9] p-3 text-sm text-[#4f6158]">
                        <p>
                          <span className="font-semibold text-[#1d3025]">Location:</span> {report.address?.trim() || "Address not provided"}
                        </p>
                        <p className="mt-1 text-xs text-[#6a7d72]">
                          Lat {report.latitude}, Lng {report.longitude}
                        </p>
                        {report.binId && (
                          <p className="mt-2 text-xs text-[#6a7d72]">
                            Bin ID: <span className="font-semibold text-[#2d3f36]">{report.binId}</span>
                          </p>
                        )}
                      </div>

                      {report.adminNotes && (
                        <div className="rounded-xl border border-[#e7d9b3] bg-[#fff9ea] p-3 text-sm text-[#7a5a13]">
                          <p className="text-xs font-black uppercase tracking-[0.14em]">Admin Notes</p>
                          <p className="mt-2">{report.adminNotes}</p>
                        </div>
                      )}

                      {report.resolvedByName && (
                        <p className="text-xs text-[#5f7167]">
                          Resolved by <span className="font-semibold text-[#1d3025]">{report.resolvedByName}</span>
                        </p>
                      )}
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
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
