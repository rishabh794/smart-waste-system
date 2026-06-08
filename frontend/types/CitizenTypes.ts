export type ReportStatus = "submitted" | "in_review" | "resolved" | "rejected";

export type ReportCategory =
  | "overflowing"
  | "damaged"
  | "missed_pickup"
  | "illegal_dumping"
  | "general";

export interface CitizenReport {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  imageUrl: string;
  address?: string | null;
  binId?: string | null;
  status: ReportStatus;
  adminNotes?: string | null;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportPayload {
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  imageUrl: string;
  address?: string;
  binId?: string;
}

export interface AdminReport extends CitizenReport {
  reportedBy: string;
  reporterEmail: string;
}
