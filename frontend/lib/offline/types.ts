import type { CreateReportPayload, ReportCategory } from "@/types/CitizenTypes";
import type { DriverBinStatus, MissedReasonCode } from "@/types/DriverTypes";
import type { OptimizedRouteState, RouteData } from "@/types/DriverTypes";

export type OutboxItemStatus = "pending" | "failed";

export interface BinStatusOptions {
  wasOverflowing?: boolean;
  missedReasonCode?: MissedReasonCode;
  missedNote?: string;
}

export type OutboxItem =
  | {
      id: string;
      type: "citizen_report";
      createdAt: number;
      status: OutboxItemStatus;
      failureReason?: string;
      payload: Omit<CreateReportPayload, "imageUrl"> & { imageUrl?: string };
      imageBlob?: Blob;
    }
  | {
      id: string;
      type: "bin_status";
      createdAt: number;
      status: OutboxItemStatus;
      failureReason?: string;
      routeId: string;
      binId: string;
      binStatus: DriverBinStatus;
      options?: BinStatusOptions;
    }
  | {
      id: string;
      type: "route_complete";
      createdAt: number;
      status: OutboxItemStatus;
      failureReason?: string;
      routeId: string;
    };

export interface PendingCitizenReport {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  address?: string;
  binId?: string;
  createdAt: string;
}

export interface RouteSnapshot {
  userId: string;
  route: RouteData | null;
  geometry: OptimizedRouteState | null;
  cachedAt: number;
}
