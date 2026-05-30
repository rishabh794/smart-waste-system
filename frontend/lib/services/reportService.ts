import { apiFetch } from "@/lib/apiFetch";
import { fetchApiJson } from "@/lib/services/apiService";
import type { CitizenReport, CreateReportPayload } from "@/types/CitizenTypes";

export const USER_REPORTS_KEY = "/api/reports/mine";

export const fetchMyReports = (url: string) => fetchApiJson<CitizenReport[]>(url);

export const createReport = (payload: CreateReportPayload) => {
  return apiFetch("/api/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
