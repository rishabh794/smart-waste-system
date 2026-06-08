"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminReportNotesField from "@/components/admin/reports/AdminReportNotesField";
import AdminReportStatusSelect from "@/components/admin/reports/AdminReportStatusSelect";
import { getApiErrorMessage } from "@/lib/services/apiService";
import { updateReportStatus } from "@/lib/services/reportService";
import type { AdminReport, ReportStatus } from "@/types/CitizenTypes";

interface AdminReportDetailFormProps {
  report: AdminReport;
  onUpdated: () => void;
}

export default function AdminReportDetailForm({ report, onUpdated }: AdminReportDetailFormProps) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStatus(report.status);
    setAdminNotes(report.adminNotes ?? "");
  }, [report]);

  const hasChanges =
    status !== report.status || adminNotes.trim() !== (report.adminNotes ?? "").trim();

  const handleSave = async () => {
    if (isSaving || !hasChanges) return;

    setIsSaving(true);

    try {
      const trimmedNotes = adminNotes.trim();
      const res = await updateReportStatus(report.id, {
        status,
        adminNotes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
      });

      if (!res.ok) {
        toast.error(await getApiErrorMessage(res, "Unable to update report status."));
        return;
      }

      toast.success("Report status updated.");
      onUpdated();
    } catch (error) {
      console.error(error);
      toast.error("Network issue while updating report.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-[#e6efe9] pt-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#527065]">Update Status</p>
      <AdminReportStatusSelect value={status} onChange={setStatus} disabled={isSaving} />
      <AdminReportNotesField value={adminNotes} onChange={setAdminNotes} disabled={isSaving} />
      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
