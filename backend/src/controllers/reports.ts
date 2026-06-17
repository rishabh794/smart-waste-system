import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { reports, reportAiAnalyses, users } from '../db/schema/index.js';
import { desc, eq } from 'drizzle-orm';
import {
  createReportBodySchema,
  getValidationErrorMessage,
  reportIdParamsSchema,
  updateReportStatusBodySchema,
} from '../validation/schemas.js';
import { updateReportStatusWithActor } from '../services/reportStatus.js';
import { processAiAnalysisJob } from '../services/aiAnalysis.js';
import { aiQueue } from '../queues/aiQueue.js';

export const createReport = async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user context' });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Only citizen users can create reports' });
  }

  const parsedBody = createReportBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { title, description, category, latitude, longitude, imageUrl, address, clientReportId } = parsedBody.data;
  const { binId } = parsedBody.data;

  try {
    const [newReport] = await db
      .insert(reports)
      .values({
        clientReportId,
        userId: req.user.id,
        binId,
        title,
        description,
        category,
        latitude,
        longitude,
        imageUrl,
        address,
      })
      .onConflictDoNothing({ target: reports.clientReportId })
      .returning({
        id: reports.id,
        binId: reports.binId,
        title: reports.title,
        description: reports.description,
        category: reports.category,
        latitude: reports.latitude,
        longitude: reports.longitude,
        imageUrl: reports.imageUrl,
        address: reports.address,
        status: reports.status,
        resolvedById: reports.resolvedById,
        resolvedByName: reports.resolvedByName,
        createdAt: reports.createdAt,
      });

    let returnedReport = newReport;

    if (!returnedReport && clientReportId) {
      const [existing] = await db
        .select({
          id: reports.id,
          binId: reports.binId,
          title: reports.title,
          description: reports.description,
          category: reports.category,
          latitude: reports.latitude,
          longitude: reports.longitude,
          imageUrl: reports.imageUrl,
          address: reports.address,
          status: reports.status,
          resolvedById: reports.resolvedById,
          resolvedByName: reports.resolvedByName,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .where(eq(reports.clientReportId, clientReportId))
        .limit(1);
        
      if (existing) {
        return res.status(200).json(existing);
      }
    }

    if (!returnedReport) {
      return res.status(500).json({ error: 'Failed to create report' });
    }

    // Fire-and-forget: AI analysis runs in the background
    if (aiQueue) {
      aiQueue.add(
        'analyze-image', 
        { reportId: returnedReport.id, imageUrl },
        { 
          attempts: 3, 
          backoff: { type: 'fixed', delay: 5 * 60 * 1000 } // 5 minutes 
        }
      ).catch((err) => {
        console.error(`[AI] Failed to add job to queue for report ${returnedReport.id}:`, err);
      });
    } else {
      processAiAnalysisJob(returnedReport.id, imageUrl).catch((err) =>
        console.error(`[AI] Background analysis failed for report ${returnedReport.id}:`, err)
      );
    }

    return res.status(201).json(returnedReport);
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
};

export const getMyReports = async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user context' });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Only citizen users can view this resource' });
  }

  try {
    const rows = await db
      .select({
        id: reports.id,
        binId: reports.binId,
        title: reports.title,
        description: reports.description,
        category: reports.category,
        latitude: reports.latitude,
        longitude: reports.longitude,
        imageUrl: reports.imageUrl,
        address: reports.address,
        status: reports.status,
        adminNotes: reports.adminNotes,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        resolvedAt: reports.resolvedAt,
        resolvedById: reports.resolvedById,
        resolvedByName: reports.resolvedByName,
        aiStatus: reportAiAnalyses.status,
        aiIsValidReport: reportAiAnalyses.isValidReport,
        aiConfidenceScore: reportAiAnalyses.confidenceScore,
        aiSeverity: reportAiAnalyses.severity,
        aiCategory: reportAiAnalyses.category,
        aiReason: reportAiAnalyses.reason,
      })
      .from(reports)
      .leftJoin(reportAiAnalyses, eq(reports.id, reportAiAnalyses.reportId))
      .where(eq(reports.userId, req.user.id))
      .orderBy(desc(reports.createdAt));

    const myReports = rows.map(({ aiStatus, aiIsValidReport, aiConfidenceScore, aiSeverity, aiCategory, aiReason, ...report }) => ({
      ...report,
      aiAnalysis: aiStatus
        ? { status: aiStatus, isValidReport: aiIsValidReport, confidenceScore: aiConfidenceScore, severity: aiSeverity, category: aiCategory, reason: aiReason }
        : null,
    }));

    return res.status(200).json(myReports);
  } catch (error) {
    console.error('Get my reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const getAllReports = async (req: Request, res: Response): Promise<any> => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    const rows = await db
      .select({
        id: reports.id,
        binId: reports.binId,
        title: reports.title,
        description: reports.description,
        category: reports.category,
        latitude: reports.latitude,
        longitude: reports.longitude,
        imageUrl: reports.imageUrl,
        address: reports.address,
        status: reports.status,
        adminNotes: reports.adminNotes,
        resolvedAt: reports.resolvedAt,
        resolvedById: reports.resolvedById,
        resolvedByName: reports.resolvedByName,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        reportedBy: users.name,
        reporterEmail: users.email,
        aiStatus: reportAiAnalyses.status,
        aiIsValidReport: reportAiAnalyses.isValidReport,
        aiConfidenceScore: reportAiAnalyses.confidenceScore,
        aiSeverity: reportAiAnalyses.severity,
        aiCategory: reportAiAnalyses.category,
        aiReason: reportAiAnalyses.reason,
      })
      .from(reports)
      .innerJoin(users, eq(reports.userId, users.id))
      .leftJoin(reportAiAnalyses, eq(reports.id, reportAiAnalyses.reportId))
      .orderBy(desc(reports.createdAt));

    const allReports = rows.map(({ aiStatus, aiIsValidReport, aiConfidenceScore, aiSeverity, aiCategory, aiReason, ...report }) => ({
      ...report,
      aiAnalysis: aiStatus
        ? { status: aiStatus, isValidReport: aiIsValidReport, confidenceScore: aiConfidenceScore, severity: aiSeverity, category: aiCategory, reason: aiReason }
        : null,
    }));

    return res.status(200).json(allReports);
  } catch (error) {
    console.error('Get all reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const updateReportStatus = async (req: Request<{ reportId: string }>, res: Response): Promise<any> => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const parsedParams = reportIdParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedParams.error) });
  }

  const parsedBody = updateReportStatusBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { reportId } = parsedParams.data;
  const { status, adminNotes } = parsedBody.data;

  try {
    const [actor] = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!actor) {
      return res.status(401).json({ error: 'Unauthorized: User profile not found' });
    }

    const updatedReport = await db.transaction(async (tx) => {
      return updateReportStatusWithActor(tx, reportId, status, adminNotes, actor);
    });

    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json(updatedReport);
  } catch (error) {
    console.error('Update report status error:', error);
    return res.status(500).json({ error: 'Failed to update report status' });
  }
};

export const deleteReport = async (req: Request<{ reportId: string }>, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user context' });
  }

  const { reportId } = req.params;

  try {
    // Determine the report's owner
    const [report] = await db
      .select({ userId: reports.userId })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Only the creator or an admin can delete it
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own reports' });
    }

    // Hard delete: delete dependent records first if they exist
    await db.delete(reportAiAnalyses).where(eq(reportAiAnalyses.reportId, reportId));
    await db.delete(reports).where(eq(reports.id, reportId));

    return res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    return res.status(500).json({ error: 'Failed to delete report' });
  }
};
