export type AdminDashboardSection = "dashboard" | "status" | "create";

export type BinConditionStatus = "active" | "maintenance" | "retired";
export type BinRouteStatus = "unknown" | "collected" | "missed" | "ASSIGNED_TODAY";

export interface City {
  id: string;
  name: string;
  depotLat: number | null;
  depotLng: number | null;
}

export interface PendingRoute {
  routeId: string;
  driverName: string;
  progress: string;
  isComplete: boolean;
}

export interface Bin {
  id: string;
  cityId: string;
  zone: string | null;
  status: BinRouteStatus | null;
  wasOverflowing?: boolean | null;
  latitude: number;
  longitude: number;
  fillLevel?: number | null;
  fillRatePerDay?: number | null;
  conditionStatus?: BinConditionStatus | null;
  lastEmptiedAt?: string | null;
  routeStatus?: string | null;
}

export interface Driver {
  id: string;
  name: string;
  cityId: string | null;
  cityName: string | null;
}

export interface CreateRoutePayload {
  driverId: string;
  binIds: string[];
}

export interface CreateBinPayload {
  latitude: number;
  longitude: number;
  cityId: string;
  status: BinConditionStatus;
}

export interface UpdateBinConditionStatusPayload {
  status: BinConditionStatus;
}

export interface CreateDriverPayload {
  name: string;
  email: string;
  password: string;
  cityId: string;
}

export interface NewBinFormState {
  latitude: string;
  longitude: string;
  cityId: string;
  status: BinConditionStatus;
}

export interface NewDriverFormState {
  name: string;
  email: string;
  password: string;
  cityId: string;
}

export interface CreateCityPayload {
  name: string;
  depotLat?: number;
  depotLng?: number;
}

export interface NewCityFormState {
  name: string;
  depotLat: string;
  depotLng: string;
}
