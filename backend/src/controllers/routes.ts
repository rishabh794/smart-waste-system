import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { routes, routeBins, bins, users, cities } from '../db/schema/index.js';
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
import { haversineDistance, DRIVER_GEOFENCE_RADIUS_M } from '../utils/geo.js';

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
      zone: cities.name,
      status: routeBins.fillStatus,
      wasOverflowing: routeBins.wasOverflowing,
      sequence: routeBins.sequenceNumber
    })
    .from(routeBins)
    .innerJoin(bins, eq(routeBins.binId, bins.id))
    .innerJoin(cities, eq(bins.cityId, cities.id))
    .where(eq(routeBins.routeId, latestRoute.id));

    // Fetch driver's city depot coordinates
    const [driver] = await db.select({ cityId: users.cityId }).from(users).where(eq(users.id, driverId)).limit(1);
    
    let depotLat: number | undefined;
    let depotLng: number | undefined;
    
    if (driver?.cityId) {
      const [city] = await db.select({ lat: cities.depotLat, lng: cities.depotLng }).from(cities).where(eq(cities.id, driver.cityId)).limit(1);
      if (city && city.lat != null && city.lng != null) {
        depotLat = city.lat;
        depotLng = city.lng;
      }
    }

    res.status(200).json({
      routeId: latestRoute.id,
      depotLat,
      depotLng,
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
  const { status, wasOverflowing, missedReasonCode, missedNote, driverLatitude, driverLongitude } = parsedBody.data;

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

    // ── Geofence check: driver must be within DRIVER_GEOFENCE_RADIUS_M of the bin (skipped for 'missed') ──
    if (status !== 'missed') {
      const [targetBin] = await db
        .select({ latitude: bins.latitude, longitude: bins.longitude })
        .from(bins)
        .where(eq(bins.id, binId))
        .limit(1);

      if (!targetBin) {
        return res.status(404).json({ error: 'Bin not found' });
      }

      const distanceM = haversineDistance(
        driverLatitude,
        driverLongitude,
        targetBin.latitude,
        targetBin.longitude
      );

      if (distanceM > DRIVER_GEOFENCE_RADIUS_M) {
        return res.status(403).json({
          error: `You must be within ${DRIVER_GEOFENCE_RADIUS_M}m of the bin to update its status. Current distance: ${Math.round(distanceM)}m.`,
        });
      }
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
    const result = await db.transaction(async (tx) => {
      // ── City enforcement: driver must have a city, and its depot must be configured ──
      const [driver] = await tx
        .select({ id: users.id, cityId: users.cityId })
        .from(users)
        .where(eq(users.id, driverId))
        .limit(1);

      if (!driver || !driver.cityId) {
        return { status: 'driver-no-city' } as const;
      }

      const [driverCity] = await tx
        .select({ id: cities.id, depotLat: cities.depotLat, depotLng: cities.depotLng })
        .from(cities)
        .where(eq(cities.id, driver.cityId))
        .limit(1);

      if (!driverCity) {
        return { status: 'driver-no-city' } as const;
      }

      // Depot coordinates must be set before routes can be dispatched (OSRM needs them)
      if (driverCity.depotLat == null || driverCity.depotLng == null) {
        return { status: 'city-no-depot' } as const;
      }

      // ── City mismatch check: all bins must belong to the driver's city ──
      const requestedBins = await tx
        .select({ id: bins.id, cityId: bins.cityId })
        .from(bins)
        .where(inArray(bins.id, binIds));

      const mismatchedBinIds = requestedBins
        .filter((bin) => bin.cityId !== driver.cityId)
        .map((bin) => bin.id);

      if (mismatchedBinIds.length > 0) {
        return { status: 'city-mismatch', mismatchedBinIds } as const;
      }

      const [pendingRoute] = await tx
        .select({
          id: routes.id,
          assignedDate: routes.assignedDate,
        })
        .from(routes)
        .where(and(eq(routes.driverId, driverId), eq(routes.status, 'pending')))
        .limit(1);

      if (pendingRoute) {
        return { status: 'driver-pending', pendingRoute } as const;
      }

      const activeBins = await tx
        .select({ id: bins.id })
        .from(bins)
        .where(and(inArray(bins.id, binIds), eq(bins.status, 'active')));

      const pendingAssignedBins = await tx
        .select({ binId: routeBins.binId })
        .from(routeBins)
        .innerJoin(routes, eq(routeBins.routeId, routes.id))
        .where(and(inArray(routeBins.binId, binIds), eq(routes.status, 'pending')));

      const activeBinSet = new Set(activeBins.map((bin) => bin.id));
      const pendingBinSet = new Set(pendingAssignedBins.map((bin) => bin.binId));
      const unavailableBinIds = binIds.filter(
        (binId) => !activeBinSet.has(binId) || pendingBinSet.has(binId)
      );

      if (unavailableBinIds.length > 0) {
        return { status: 'bins-unavailable', unavailableBinIds } as const;
      }

      const [newRoute] = await tx
        .insert(routes)
        .values({
          driverId,
          assignedDate: getISTDate(),
          status: 'pending',
        })
        .returning();

      if (!newRoute) {
        return { status: 'create-failed' } as const;
      }

      const routeBinsData = binIds.map((binId, index) => ({
        routeId: newRoute.id,
        binId: binId,
        sequenceNumber: index + 1,
        fillStatus: 'unknown',
        wasOverflowing: false,
      }));

      await tx.insert(routeBins).values(routeBinsData);

      return { status: 'created', routeId: newRoute.id } as const;
    });

    if (result.status === 'driver-no-city') {
      return res.status(400).json({
        error: 'Driver is not assigned to any city. Please assign a city first.',
      });
    }

    if (result.status === 'city-no-depot') {
      return res.status(400).json({
        error: 'The driver\'s city does not have depot coordinates configured. Please set depot coordinates before dispatching routes.',
      });
    }

    if (result.status === 'city-mismatch') {
      return res.status(403).json({
        error: 'Some bins belong to a different city than the driver.',
        mismatchedBinIds: result.mismatchedBinIds,
      });
    }

    if (result.status === 'driver-pending') {
      return res.status(409).json({
        error: 'Driver already has a pending route',
        pendingRouteId: result.pendingRoute.id,
        assignedDate: result.pendingRoute.assignedDate,
      });
    }

    if (result.status === 'bins-unavailable') {
      return res.status(409).json({
        error: 'Some bins are unavailable for route assignment',
        unavailableBinIds: result.unavailableBinIds,
      });
    }

    if (result.status === 'create-failed') {
      return res.status(500).json({ error: 'Failed to create route' });
    }

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
