import { and, eq, inArray } from 'drizzle-orm';
import { reports } from '../db/schema/index.js';

export type ReportResolutionActor = {
  id: string;
  name: string;
};

const autoResolvableStatuses = ['submitted', 'in_review'] as const;

const buildResolutionUpdate = (actor: ReportResolutionActor, resolvedAt: Date, updatedAt: Date) => ({
  status: 'resolved' as const,
  resolvedAt,
  resolvedById: actor.id,
  resolvedByName: actor.name,
  updatedAt,
});

export const resolveReportsForBin = async (
  tx: any,
  binId: string,
  actor: ReportResolutionActor,
) => {
  const resolvedAt = new Date();

  return tx
    .update(reports)
    .set(buildResolutionUpdate(actor, resolvedAt, resolvedAt))
    .where(
      and(
        eq(reports.binId, binId),
        inArray(reports.status, autoResolvableStatuses),
      )
    )
    .returning({
      id: reports.id,
      status: reports.status,
      resolvedAt: reports.resolvedAt,
      resolvedById: reports.resolvedById,
      resolvedByName: reports.resolvedByName,
      updatedAt: reports.updatedAt,
    });
};

export const updateReportStatusWithActor = async (
  tx: any,
  reportId: string,
  status: 'submitted' | 'in_review' | 'resolved' | 'rejected',
  adminNotes: string | undefined,
  actor: ReportResolutionActor,
) => {
  const [existingReport] = await tx
    .select({
      id: reports.id,
      resolvedAt: reports.resolvedAt,
    })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!existingReport) {
    return null;
  }

  const updatedAt = new Date();

  const updatePayload =
    status === 'resolved'
      ? buildResolutionUpdate(actor, existingReport.resolvedAt ?? updatedAt, updatedAt)
      : {
          status,
          adminNotes,
          resolvedAt: null,
          resolvedById: null,
          resolvedByName: null,
          updatedAt: new Date(),
        };

  const [updatedReport] = await tx
    .update(reports)
    .set(updatePayload)
    .where(eq(reports.id, reportId))
    .returning({
      id: reports.id,
      status: reports.status,
      adminNotes: reports.adminNotes,
      resolvedAt: reports.resolvedAt,
      resolvedById: reports.resolvedById,
      resolvedByName: reports.resolvedByName,
      updatedAt: reports.updatedAt,
    });

  return updatedReport ?? null;
};