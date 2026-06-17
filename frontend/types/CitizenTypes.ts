export type ReportStatus = "submitted" | "in_review" | "resolved" | "rejected";

export type ReportCategory =
  | "overflowing"
  | "damaged"
  | "missed_pickup"
  | "illegal_dumping"
  | "general";

export type AiAnalysisStatus = "pending" | "completed" | "failed";

export interface ReportAiAnalysis {
  status: AiAnalysisStatus;
  isValidReport?: boolean | null;
  confidenceScore?: number | null;
  severity?: "low" | "medium" | "high" | "critical" | null;
  category?: string | null;
  reason?: string | null;
}

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
  aiAnalysis?: ReportAiAnalysis | null;
}


export interface CreateReportPayload {
  clientReportId?: string;
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
