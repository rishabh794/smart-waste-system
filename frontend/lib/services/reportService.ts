import { apiFetch } from "@/lib/apiFetch";
import { fetchApiJson } from "@/lib/services/apiService";
import type { AdminReport, CitizenReport, CreateReportPayload, ReportStatus } from "@/types/CitizenTypes";

export const USER_REPORTS_KEY = "/api/reports/mine";
export const ADMIN_REPORTS_KEY = "/api/reports";

export const fetchMyReports = (url: string) => fetchApiJson<CitizenReport[]>(url);

export const fetchAllReports = (url: string) => fetchApiJson<AdminReport[]>(url);

export const createReport = (payload: CreateReportPayload) => {
  return apiFetch("/api/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateReportStatus = (
  reportId: string,
  payload: { status: ReportStatus; adminNotes?: string }
) => {
  return apiFetch(`/api/reports/${reportId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteReport = (reportId: string) => {
  return apiFetch(`/api/reports/${reportId}`, {
    method: "DELETE",
  });
};

export interface NearbyBinResult {
  bin: { id: string; latitude: number; longitude: number; zone: string | null } | null;
  distance: number | null;
}

export const fetchNearbyBin = async (
  latitude: number,
  longitude: number
): Promise<NearbyBinResult> => {
  const res = await apiFetch(
    `/api/bins/nearby?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`
  );

  if (!res.ok) {
    throw new Error("Failed to look up nearby bins.");
  }

  return res.json() as Promise<NearbyBinResult>;
};
