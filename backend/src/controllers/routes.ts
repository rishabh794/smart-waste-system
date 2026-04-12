import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { routes, routeBins, bins } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export const getDriverTodayRoute = async (req: Request, res: Response): Promise<any> => {
  const driverId = req.params.driverId as string;
  if (!driverId) {
    return res.status(400).json({ error: 'Driver ID is required' });
  }

  try {
    // Find today's route for this driver
    const todayRoute = await db.select().from(routes)
      .where(eq(routes.driverId, driverId))
      .limit(1);

    if (todayRoute.length === 0) {
      return res.status(200).json({ message: 'No route assigned for today', bins: [] });
    }

    const currentRouteId = todayRoute[0]!.id;
    // Fetch the bins assigned to this route (Joining route_bins with bins)
    const assignedBins = await db.select({
      binId: bins.id,
      latitude: bins.latitude,
      longitude: bins.longitude,
      zone: bins.zone,
      status: routeBins.fillStatus,
      sequence: routeBins.sequenceNumber
    })
    .from(routeBins)
    .innerJoin(bins, eq(routeBins.binId, bins.id))
    .where(eq(routeBins.routeId, currentRouteId));

    res.status(200).json({
      routeId: todayRoute[0]?.id,
      bins: assignedBins.sort((a, b) => a.sequence - b.sequence) // Sort by driving sequence
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch route' });
  }
};