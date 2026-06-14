export type DriverBinStatus = "unknown" | "collected" | "missed";
export type MissedReasonCode =
  | "road_blocked"
  | "access_denied"
  | "gate_locked"
  | "vehicle_breakdown"
  | "safety_hazard";

export interface RouteBin {
  binId: string;
  sequence: number;
  zone: string;
  status: DriverBinStatus;
  wasOverflowing?: boolean;
  latitude: number;
  longitude: number;
  optimizedSequence?: number;
}

export interface RouteData {
  routeId: string;
  depotLat?: number;
  depotLng?: number;
  bins: RouteBin[];
}

export interface OptimizedRouteState {
  bins: RouteBin[];
  routePath: [number, number][];
  depotLat?: number;
  depotLng?: number;
}

export interface BinStatusUpdate {
  binId: string;
  status: DriverBinStatus;
  wasOverflowing?: boolean;
  missedReasonCode?: MissedReasonCode;
  missedNote?: string;
}
