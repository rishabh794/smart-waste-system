export type AdminDashboardSection = "dashboard" | "status" | "create";

export interface PendingRoute {
  routeId: string;
  driverName: string;
  progress: string;
  isComplete: boolean;
}

export interface Bin {
  id: string;
  zone: string;
  status: string | null;
  latitude: number;
  longitude: number;
}

export interface Driver {
  id: string;
  name: string;
}

export interface CreateRoutePayload {
  driverId: string;
  binIds: string[];
}

export interface CreateBinPayload {
  latitude: number;
  longitude: number;
  zone: string;
}

export interface CreateDriverPayload {
  name: string;
  email: string;
  password: string;
}

export interface NewBinFormState {
  latitude: string;
  longitude: string;
  zone: string;
}

export interface NewDriverFormState {
  name: string;
  email: string;
  password: string;
}
