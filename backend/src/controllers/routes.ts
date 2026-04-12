import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { routes, routeBins, bins } from '../db/schema/index.js';
import {and,desc, eq } from 'drizzle-orm';

export const getDriverTodayRoute = async (req: Request, res: Response): Promise<any> => {
  const driverId = req.params.driverId as string;

  if (!driverId) {
    return res.status(400).json({ error: 'Driver ID is required' });
  }

  if (req.user!.role === 'driver' && req.user!.id !== driverId) {
    return res.status(403).json({ error: 'Forbidden: Cannot access another driver\'s route' });
  }

  try {
    const [latestRoute] = await db
      .select()
      .from(routes)
      .where(eq(routes.driverId, driverId))
      .orderBy(desc(routes.assignedDate))
      .limit(1);

    if (!latestRoute) {
      return res.status(200).json({ message: 'No route assigned for today', bins: [] });
    }

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
    .where(eq(routeBins.routeId, latestRoute.id));

    res.status(200).json({
      routeId: latestRoute.id,
      bins: assignedBins.sort((a, b) => a.sequence - b.sequence)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch route' });
  }
};

export const updateBinStatus = async (req: Request, res: Response): Promise<any> => {
  const routeId = req.params.routeId as string;
  const binId = req.params.binId as string;
  const { status } = req.body; 

  if (!routeId || !binId || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Update the specific bin on the specific route
    await db.update(routeBins)
      .set({ fillStatus: status })
      .where(and(eq(routeBins.routeId, routeId), eq(routeBins.binId, binId)))

    return res.status(200).json({ message: `Bin ${binId} marked as ${status}` });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update bin status' });
  }
};

export const createRoute = async (req: Request, res: Response): Promise<any> => {
  const { driverId, binIds } = req.body;

  if (!driverId || !binIds || !Array.isArray(binIds) || binIds.length === 0) {
    return res.status(400).json({ error: 'Driver ID and Bin IDs are required' });
  }

  try {
    // Create the Route
    const [newRoute] = await db.insert(routes).values({
      driverId,
      assignedDate: new Date().toISOString(), 
      status: 'pending'
    }).returning();

    if (!newRoute) {
      return res.status(500).json({ error: 'Failed to create route' });
    }

    // Prepare the payload for the route_bins junction table
    const routeBinsData = binIds.map((binId, index) => ({
      routeId: newRoute.id,
      binId: binId,
      sequenceNumber: index + 1, 
      fillStatus: 'unknown'
    }));

    // Insert all bins into the route at once
    await db.insert(routeBins).values(routeBinsData);

    return res.status(201).json({ message: 'Route created successfully' });
  } catch (error) {
    console.error('Create route error:', error);
    return res.status(500).json({ error: 'Failed to create route' });
  }
};