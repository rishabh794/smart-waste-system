import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { routes, routeBins, bins, users } from '../db/schema/index.js';
import {and,desc, eq , inArray} from 'drizzle-orm';
import {
  createRouteBodySchema,
  driverIdParamsSchema,
  getValidationErrorMessage,
  routeBinParamsSchema,
  routeIdParamsSchema,
  updateBinStatusBodySchema,
} from '../validation/schemas.js';
import { resolveReportsForBin } from '../services/reportStatus.js';

const getISTDate = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
};

export const getDriverTodayRoute = async (req: Request, res: Response): Promise<any> => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'driver')) {
    return res.status(403).json({ error: 'Forbidden: Driver or admin access required' });
  }

  const parsedParams = driverIdParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedParams.error) });
  }

  const { driverId } = parsedParams.data;

  if (req.user!.role === 'driver' && req.user!.id !== driverId) {
    return res.status(403).json({ error: 'Forbidden: Cannot access another driver\'s route' });
  }

  try {
    const [latestRoute] = await db
      .select()
      .from(routes)
      .where(
        and(
          eq(routes.driverId, driverId),
          eq(routes.status, 'pending') // Only grab unfinished routes!
        )
      )
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
      wasOverflowing: routeBins.wasOverflowing,
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
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'driver')) {
    return res.status(403).json({ error: 'Forbidden: Driver or admin access required' });
  }

  const parsedParams = routeBinParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedParams.error) });
  }

  const parsedBody = updateBinStatusBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { routeId, binId } = parsedParams.data;
  const { status, wasOverflowing, missedReasonCode, missedNote } = parsedBody.data;

  try {
    const [targetRoute] = await db.select({
      id: routes.id,
      driverId: routes.driverId,
      status: routes.status,
    })
    .from(routes)
    .where(eq(routes.id, routeId))
    .limit(1);

    if (!targetRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (req.user.role === 'driver' && req.user.id !== targetRoute.driverId) {
      return res.status(403).json({ error: 'Forbidden: Cannot update another driver\'s route' });
    }

    const actorUserId = req.user.id;

    if (targetRoute.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot update bin status for a completed route' });
    }

    const normalizedMissedReasonCode = status === 'missed' ? missedReasonCode ?? null : null;
    const normalizedMissedNote = status === 'missed' ? missedNote ?? null : null;
    const normalizedWasOverflowing = status === 'collected' ? Boolean(wasOverflowing) : false;

    await db.transaction(async (tx) => {
      const [actor] = await tx
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, actorUserId))
        .limit(1);

      if (!actor) {
        throw new Error('ACTOR_NOT_FOUND');
      }

      const [updatedBin] = await tx.update(routeBins)
        .set({
          fillStatus: status,
          wasOverflowing: normalizedWasOverflowing,
          missedReason: normalizedMissedReasonCode,
          missedNote: normalizedMissedNote,
        })
        .where(and(eq(routeBins.routeId, routeId), eq(routeBins.binId, binId)))
        .returning({
          binId: routeBins.binId,
        });

      if (!updatedBin) {
        throw new Error('BIN_NOT_ASSIGNED_TO_ROUTE');
      }

      // Keep physical bin telemetry in sync only when the bin is actually emptied.
      if (status === 'collected') {
        await resolveReportsForBin(tx, binId, actor);

        await tx.update(bins)
          .set({
            fillLevel: 0,
            lastEmptiedAt: new Date(),
          })
          .where(eq(bins.id, binId));
      }
    });

    return res.status(200).json({ message: `Bin ${binId} marked as ${status}` });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACTOR_NOT_FOUND') {
      return res.status(401).json({ error: 'Unauthorized: User profile not found' });
    }

    if (error instanceof Error && error.message === 'BIN_NOT_ASSIGNED_TO_ROUTE') {
      return res.status(404).json({ error: 'Bin is not assigned to this route' });
    }

    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update bin status' });
  }
};

export const createRoute = async (req: Request, res: Response): Promise<any> => {
  const parsedBody = createRouteBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { driverId, binIds } = parsedBody.data;

  try {
    const activeBins = await db
      .select({ id: bins.id })
      .from(bins)
      .where(and(inArray(bins.id, binIds), eq(bins.status, 'active')));

    if (activeBins.length !== binIds.length) {
      const activeBinSet = new Set(activeBins.map((bin) => bin.id));
      const unavailableBinIds = binIds.filter((binId) => !activeBinSet.has(binId));

      return res.status(400).json({
        error: 'Some bins are unavailable for route assignment',
        unavailableBinIds,
      });
    }

    // Create the Route
    const [newRoute] = await db.insert(routes).values({
      driverId,
      assignedDate: getISTDate(), 
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
      fillStatus: 'unknown',
      wasOverflowing: false,
    }));

    // Insert all bins into the route at once
    await db.insert(routeBins).values(routeBinsData);

    return res.status(201).json({ message: 'Route created successfully' });
  } catch (error) {
    console.error('Create route error:', error);
    return res.status(500).json({ error: 'Failed to create route' });
  }
};

export const completeRoute = async (req: Request, res: Response): Promise<any> => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'driver')) {
    return res.status(403).json({ error: 'Forbidden: Driver or admin access required' });
  }

  const parsedParams = routeIdParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedParams.error) });
  }

  const { routeId } = parsedParams.data;

  try {
    const [targetRoute] = await db.select({
      id: routes.id,
      driverId: routes.driverId,
      status: routes.status,
    })
    .from(routes)
    .where(eq(routes.id, routeId))
    .limit(1);

    if (!targetRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (req.user.role === 'driver' && req.user.id !== targetRoute.driverId) {
      return res.status(403).json({ error: 'Forbidden: Cannot complete another driver\'s route' });
    }

    if (targetRoute.status === 'completed') {
      return res.status(400).json({ error: 'Route is already completed' });
    }

    // Fetch all bins assigned to this specific route
    const assignedBins = await db.select()
      .from(routeBins)
      .where(eq(routeBins.routeId, routeId));

    if (assignedBins.length === 0) {
      return res.status(400).json({ error: 'Cannot finish route: No bins are assigned to this route' });
    }

    // Check if any bin has an empty or 'unknown' status
    const hasUnresolvedBins = assignedBins.some(
      bin => !bin.fillStatus || bin.fillStatus.toLowerCase() === 'unknown'
    );

    //  Block completion if work is unfinished
    if (hasUnresolvedBins) {
      return res.status(400).json({ 
        error: 'Cannot finish route: You still have unresolved bins to check!' 
      });
    }

    //  If all clear, mark as completed
    const [completedRoute] = await db.update(routes)
      .set({ status: 'completed' })
      .where(eq(routes.id, routeId))
      .returning({
        id: routes.id,
      });

    if (!completedRoute) {
      return res.status(500).json({ error: 'Failed to complete route' });
    }

    return res.status(200).json({ message: 'Route marked as completed' });
  } catch (error) {
    console.error('Complete route error:', error);
    return res.status(500).json({ error: 'Failed to complete route' });
  }
};

export const getPendingRoutes = async (req: Request, res: Response): Promise<any> => {
  try {
    // Get all routes that are currently pending
    const activeRoutes = await db.select({
      routeId: routes.id,
      driverName: users.name,
      assignedDate: routes.assignedDate,
    })
    .from(routes)
    .innerJoin(users, eq(routes.driverId, users.id))
    .where(eq(routes.status, 'pending'));

    if (activeRoutes.length === 0) return res.status(200).json([]);

    //  Fetch the bins for these active routes to calculate progress
    const routeIds = activeRoutes.map(r => r.routeId);
    
    const activeRouteBins = await db.select({
      routeId: routeBins.routeId,
      status: routeBins.fillStatus
    })
    .from(routeBins)
    .where(inArray(routeBins.routeId, routeIds));

    // Assemble the payload with progress tracking
    const dashboardData = activeRoutes.map(route => {
      const binsForThisRoute = activeRouteBins.filter(b => b.routeId === route.routeId);
      const totalBins = binsForThisRoute.length;
      const resolvedBins = binsForThisRoute.filter(
        b => !!b.status && b.status.toLowerCase() !== 'unknown'
      ).length;

      return {
        ...route,
        progress: `${resolvedBins} / ${totalBins} Resolved`,
        isComplete: resolvedBins === totalBins && totalBins > 0
      };
    });

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Active routes error:', error);
    return res.status(500).json({ error: 'Failed to fetch active routes' });
  }
};
