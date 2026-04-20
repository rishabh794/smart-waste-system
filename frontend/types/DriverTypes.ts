export type DriverBinStatus = "unknown" | "collected" | "overflowing" | "missed";
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
  latitude: number;
  longitude: number;
  optimizedSequence?: number;
}

export interface RouteData {
  routeId: string;
  bins: RouteBin[];
}

export interface OptimizedRouteState {
  bins: RouteBin[];
  routePath: [number, number][];
}

export interface BinStatusUpdate {
  binId: string;
  status: DriverBinStatus;
  missedReasonCode?: MissedReasonCode;
  missedNote?: string;
}
