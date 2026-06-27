import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { bins, routeBins, routes, cities } from '../db/schema/index.js';
import { and, eq, between } from 'drizzle-orm';
import {
  binIdParamsSchema,
  createBinBodySchema,
  getValidationErrorMessage,
  nearbyBinQuerySchema,
  updateBinConditionStatusBodySchema,
} from '../validation/schemas.js';
import { haversineDistance, boundingBox, CITIZEN_NEARBY_RADIUS_M } from '../utils/geo.js';

export const getAllBins = async (req: Request, res: Response) => {
  try {
    const rawBins = await db.select({
      id: bins.id,
      latitude: bins.latitude,
      longitude: bins.longitude,
      cityId: bins.cityId,
      zone: cities.name,
      fillLevel: bins.fillLevel,
      fillRatePerDay: bins.fillRatePerDay,
      conditionStatus: bins.status,
      lastEmptiedAt: bins.lastEmptiedAt,
      status: routeBins.fillStatus,
      wasOverflowing: routeBins.wasOverflowing,
      routeStatus: routes.status // We need to know if the route is active!
    })
    .from(bins)
    .innerJoin(cities, eq(bins.cityId, cities.id))
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

  const { latitude, longitude, cityId, status } = parsedBody.data;

  try {
    // Verify the city exists
    const [city] = await db.select({ id: cities.id }).from(cities).where(eq(cities.id, cityId)).limit(1);
    if (!city) {
      return res.status(400).json({ error: 'Selected city does not exist.' });
    }

    const [newBin] = await db.insert(bins).values({
      latitude,
      longitude,
      cityId,
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

export const getNearbyBin = async (req: Request, res: Response): Promise<any> => {
  const parsedQuery = nearbyBinQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedQuery.error) });
  }

  const { latitude, longitude } = parsedQuery.data;

  try {
    // Step 1: Bounding-box pre-filter — only scan bins in a CITIZEN_NEARBY_RADIUS_M box
    const box = boundingBox(latitude, longitude, CITIZEN_NEARBY_RADIUS_M);

    const candidates = await db
      .select({
        id: bins.id,
        latitude: bins.latitude,
        longitude: bins.longitude,
        zone: cities.name,
      })
      .from(bins)
      .innerJoin(cities, eq(bins.cityId, cities.id))
      .where(
        and(
          eq(bins.status, 'active'),
          between(bins.latitude, box.minLat, box.maxLat),
          between(bins.longitude, box.minLon, box.maxLon)
        )
      );

    // Step 2: Haversine refinement on the small candidate set
    let nearest: { id: string; latitude: number; longitude: number; zone: string | null } | null = null;
    let nearestDistance = Infinity;

    for (const candidate of candidates) {
      const d = haversineDistance(latitude, longitude, candidate.latitude, candidate.longitude);
      if (d <= CITIZEN_NEARBY_RADIUS_M && d < nearestDistance) {
        nearest = candidate;
        nearestDistance = d;
      }
    }

    return res.status(200).json({
      bin: nearest,
      distance: nearest ? Math.round(nearestDistance) : null,
    });
  } catch (error) {
    console.error('Nearby bin lookup error:', error);
    return res.status(500).json({ error: 'Failed to look up nearby bins' });
  }
};