import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { bins , routeBins, routes} from '../db/schema/index.js';
import { and, eq } from 'drizzle-orm';
import {
  binIdParamsSchema,
  createBinBodySchema,
  getValidationErrorMessage,
  updateBinConditionStatusBodySchema,
} from '../validation/schemas.js';

export const getAllBins = async (req: Request, res: Response) => {
  try {
    const rawBins = await db.select({
      id: bins.id,
      latitude: bins.latitude,
      longitude: bins.longitude,
      zone: bins.zone,
      fillLevel: bins.fillLevel,
      fillRatePerDay: bins.fillRatePerDay,
      conditionStatus: bins.status,
      lastEmptiedAt: bins.lastEmptiedAt,
      status: routeBins.fillStatus,
      wasOverflowing: routeBins.wasOverflowing,
      routeStatus: routes.status // We need to know if the route is active!
    })
    .from(bins)
    .leftJoin(routeBins, eq(bins.id, routeBins.binId))
    .leftJoin(routes, eq(routeBins.routeId, routes.id));

    const binMap = new Map();

    for (const row of rawBins) {
      const existing = binMap.get(row.id);

      //  If we find ANY row indicating this bin is on a pending route, LOCK IT.
      if (row.routeStatus === 'pending') {
        binMap.set(row.id, { ...row, status: 'ASSIGNED_TODAY' });
        continue; // Skip the rest of the loop, do not let historical data overwrite this lock!
      }

      // If it's not pending, only save it if we haven't already locked it as ASSIGNED_TODAY
      if (!existing || existing.status !== 'ASSIGNED_TODAY') {
        binMap.set(row.id, row);
      }
    }

    res.status(200).json(Array.from(binMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
};

export const createBin = async (req: Request, res: Response): Promise<any> => {
  const parsedBody = createBinBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { latitude, longitude, zone, status } = parsedBody.data;

  try {
    const [newBin] = await db.insert(bins).values({
      latitude,
      longitude,
      zone: zone || 'Unassigned',
      status,
    }).returning();

    return res.status(201).json(newBin);
  } catch (error) {
    console.error('Create bin error:', error);
    return res.status(500).json({ error: 'Failed to create bin' });
  }
};

export const updateBinConditionStatus = async (req: Request, res: Response): Promise<any> => {
  const parsedParams = binIdParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedParams.error) });
  }

  const parsedBody = updateBinConditionStatusBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { binId } = parsedParams.data;
  const { status } = parsedBody.data;

  try {
    const [pendingAssignment] = await db
      .select({ routeId: routeBins.routeId })
      .from(routeBins)
      .innerJoin(routes, eq(routeBins.routeId, routes.id))
      .where(and(eq(routeBins.binId, binId), eq(routes.status, 'pending')))
      .limit(1);

    if (pendingAssignment) {
      return res.status(409).json({
        error: 'Cannot update bin condition status while bin is ON ROUTE',
      });
    }

    const [updatedBin] = await db
      .update(bins)
      .set({ status })
      .where(eq(bins.id, binId))
      .returning({
        id: bins.id,
        status: bins.status,
      });

    if (!updatedBin) {
      return res.status(404).json({ error: 'Bin not found' });
    }

    return res.status(200).json({
      message: `Bin ${binId} status updated to ${status}`,
      bin: updatedBin,
    });
  } catch (error) {
    console.error('Update bin condition status error:', error);
    return res.status(500).json({ error: 'Failed to update bin status' });
  }
};