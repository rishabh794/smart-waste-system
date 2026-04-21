import { apiFetch } from "@/lib/apiFetch";
import { fetchApiJson } from "@/lib/services/apiService";
import type {
  Bin,
  CreateBinPayload,
  CreateDriverPayload,
  CreateRoutePayload,
  Driver,
  PendingRoute,
  UpdateBinConditionStatusPayload,
} from "@/types/AdminTypes";

export const ADMIN_BINS_KEY = "/api/bins";
export const ADMIN_DRIVERS_KEY = "/api/users/drivers";
export const ADMIN_PENDING_ROUTES_KEY = "/api/routes/pending";

export const fetchBins = (url: string) => fetchApiJson<Bin[]>(url);

export const fetchDrivers = (url: string) => fetchApiJson<Driver[]>(url);

export const fetchPendingRoutes = (url: string) => fetchApiJson<PendingRoute[]>(url);

export const createRoute = (payload: CreateRoutePayload) => {
  return apiFetch("/api/routes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const createBin = (payload: CreateBinPayload) => {
  return apiFetch("/api/bins", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateBinConditionStatus = (
  binId: string,
  payload: UpdateBinConditionStatusPayload
) => {
  return apiFetch(`/api/bins/${binId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const createDriver = (payload: CreateDriverPayload) => {
  return apiFetch("/api/users/drivers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
