import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { reports, users } from '../db/schema/index.js';
import { desc, eq } from 'drizzle-orm';
import {
  createReportBodySchema,
  getValidationErrorMessage,
  reportIdParamsSchema,
  updateReportStatusBodySchema,
} from '../validation/schemas.js';

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

  const { title, description, category, latitude, longitude, imageUrl, address } = parsedBody.data;

  try {
    const [newReport] = await db
      .insert(reports)
      .values({
        userId: req.user.id,
        title,
        description,
        category,
        latitude,
        longitude,
        imageUrl,
        address,
      })
      .returning({
        id: reports.id,
        title: reports.title,
        description: reports.description,
        category: reports.category,
        latitude: reports.latitude,
        longitude: reports.longitude,
        imageUrl: reports.imageUrl,
        address: reports.address,
        status: reports.status,
        createdAt: reports.createdAt,
      });

    if (!newReport) {
      return res.status(500).json({ error: 'Failed to create report' });
    }

    return res.status(201).json(newReport);
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
    const myReports = await db
      .select({
        id: reports.id,
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
      })
      .from(reports)
      .where(eq(reports.userId, req.user.id))
      .orderBy(desc(reports.createdAt));

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
    const allReports = await db
      .select({
        id: reports.id,
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
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
        reportedBy: users.name,
        reporterEmail: users.email,
      })
      .from(reports)
      .innerJoin(users, eq(reports.userId, users.id))
      .orderBy(desc(reports.createdAt));

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
    const [existingReport] = await db
      .select({
        id: reports.id,
        resolvedAt: reports.resolvedAt,
      })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const resolvedAt = status === 'resolved' ? existingReport.resolvedAt ?? new Date() : null;

    const [updatedReport] = await db
      .update(reports)
      .set({
        status,
        adminNotes,
        resolvedAt,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))
      .returning({
        id: reports.id,
        status: reports.status,
        adminNotes: reports.adminNotes,
        resolvedAt: reports.resolvedAt,
        updatedAt: reports.updatedAt,
      });

    if (!updatedReport) {
      return res.status(500).json({ error: 'Failed to update report status' });
    }

    return res.status(200).json(updatedReport);
  } catch (error) {
    console.error('Update report status error:', error);
    return res.status(500).json({ error: 'Failed to update report status' });
  }
};
