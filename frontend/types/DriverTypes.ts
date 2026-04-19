export interface RouteBin {
  binId: string;
  sequence: number;
  zone: string;
  status: string;
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
  status: string;
}
