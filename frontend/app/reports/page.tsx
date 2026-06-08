"use client";

import Link from "next/link";
import Image, { type ImageLoader } from "next/image";
import useSWR from "swr";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DataLoadingState from "@/components/ui/DataLoadingState";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { fetchMyReports, USER_REPORTS_KEY } from "@/lib/services/reportService";
import { formatReportCategory, formatReportDateTime, STATUS_STYLES } from "@/lib/reportDisplay";
import type { CitizenReport } from "@/types/CitizenTypes";

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
          <DashboardPageHeader
            eyebrow="Citizen History"
            title="My Reports"
            description="Track every report you have submitted and review resolution updates from the operations team."
            actions={
              <Link href="/report" className="btn-primary">
                New Report
              </Link>
            }
          />

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
                  className="soft-surface rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        <h2 className="text-lg font-extrabold text-[#1d3025] sm:text-xl">{report.title}</h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1a7b3a]">
                        {formatReportCategory(report.category)}
                      </p>
                      <p className="text-sm text-[#5f7167]">{report.description}</p>
                    </div>

                    <div className="text-xs text-[#607267]">
                      <p>
                        <span className="font-semibold text-[#2d3f36]">Submitted:</span> {formatReportDateTime(report.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[#2d3f36]">Updated:</span> {formatReportDateTime(report.updatedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[#2d3f36]">Resolved:</span> {formatReportDateTime(report.resolvedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                    <div className="space-y-3 text-sm text-[#4f6158]">
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

                      {report.adminNotes && (
                        <div className="border-l-4 border-[#efbe53] pl-3 text-[#7a5a13]">
                          <p className="text-xs font-black uppercase tracking-[0.14em]">Admin Notes</p>
                          <p className="mt-1">{report.adminNotes}</p>
                        </div>
                      )}

                      {report.resolvedByName && (
                        <p className="text-xs text-[#5f7167]">
                          Resolved by <span className="font-semibold text-[#1d3025]">{report.resolvedByName}</span>
                        </p>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#e4ece6] bg-[#f6faf7] lg:max-h-40">
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
