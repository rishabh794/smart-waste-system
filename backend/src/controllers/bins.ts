import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { bins , routeBins, routes} from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { createBinBodySchema, getValidationErrorMessage } from '../validation/schemas.js';

export const getAllBins = async (req: Request, res: Response) => {
  try {
    const rawBins = await db.select({
      id: bins.id,
      latitude: bins.latitude,
      longitude: bins.longitude,
      zone: bins.zone,
      status: routeBins.fillStatus,
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

  const { latitude, longitude, zone } = parsedBody.data;

  try {
    const [newBin] = await db.insert(bins).values({
      latitude,
      longitude,
      zone: zone || 'Unassigned'
    }).returning();

    return res.status(201).json(newBin);
  } catch (error) {
    console.error('Create bin error:', error);
    return res.status(500).json({ error: 'Failed to create bin' });
  }
};