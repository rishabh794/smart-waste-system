import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users , routes , routeBins} from '../db/schema/index.js';
import { eq, and, sql, gte } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import {
  createDriverBodySchema,
  driverIdParamsSchema,
  getValidationErrorMessage,
} from '../validation/schemas.js';

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, 'driver'));

    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const createDriver = async (req: Request, res: Response): Promise<any> => {
  const parsedBody = createDriverBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { name, email, password, phone } = parsedBody.data;

  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newDriver] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      phone,
      role: 'driver' 
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email
    }); 

    return res.status(201).json(newDriver);
  } catch (error) {
    console.error('Create driver error:', error);
    return res.status(500).json({ error: 'Failed to create driver account' });
  }
};

export const getDriverStats = async (req: Request<{ driverId: string }>, res: Response) => {
  try {
    const parsedParams = driverIdParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      return res.status(400).json({ error: getValidationErrorMessage(parsedParams.error) });
    }

    const { driverId } = parsedParams.data;

    // Drivers may only access their own stats. Admins can access any driver.
    if (req.user?.role === 'driver' && req.user.id !== driverId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own stats' });
    }

    // Calculate Total Routes Completed
    const completedRoutesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(routes)
      .where(
        and(
          eq(routes.driverId, driverId),
          eq(routes.status, 'completed')
        )
      );

    // Calculate lifetime serviced bins and overflow observations.
    const [collectedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(routeBins)
      .innerJoin(routes, eq(routeBins.routeId, routes.id))
      .where(
        and(
          eq(routes.driverId, driverId),
          eq(routeBins.fillStatus, 'collected')
        )
      );

    const [overflowObservedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(routeBins)
      .innerJoin(routes, eq(routeBins.routeId, routes.id))
      .where(
        and(
          eq(routes.driverId, driverId),
          eq(routeBins.fillStatus, 'collected'),
          eq(routeBins.wasOverflowing, true)
        )
      );

    const collected = Number(collectedResult?.count) || 0;
    const overflowing = Number(overflowObservedResult?.count) || 0;

    // Return daily collected-bin counts for the recent 8 weeks to support weekly pagination.
    const velocityWindowDays = 56;
    const velocityStartDate = new Date();
    velocityStartDate.setUTCDate(velocityStartDate.getUTCDate() - (velocityWindowDays - 1));
    const formattedDate = velocityStartDate.toISOString().slice(0, 10);

    const weeklyVelocity = await db
      .select({
        date: routes.assignedDate,
        count: sql<number>`count(*)`
      })
      .from(routeBins)
      .innerJoin(routes, eq(routeBins.routeId, routes.id))
      .where(
        and(
          eq(routes.driverId, driverId),
          eq(routeBins.fillStatus, 'collected'),
          gte(routes.assignedDate, formattedDate) 
        )
      )
      .groupBy(routes.assignedDate)
      .orderBy(routes.assignedDate);

    // Send the perfectly formatted payload to the frontend
    return res.status(200).json({
      totalRoutesCompleted: Number(completedRoutesResult[0]?.count) || 0,
      binHealth: {
        collected,
        overflowing,
        total: collected,
        overflowRatio: collected > 0 
            ? Math.round((overflowing / collected) * 100) 
            : 0
      },
      weeklyVelocity
    });

  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return res.status(500).json({ error: 'Failed to fetch driver stats' });
  }
};

