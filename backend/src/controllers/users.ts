import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users , routes , routeBins} from '../db/schema/index.js';
import { eq, and, sql, gte } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await db.select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(eq(users.role, 'driver'));

    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const createDriver = async (req: Request, res: Response): Promise<any> => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

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
    const { driverId } = req.params;

    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID is required' });
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

    // Calculate Lifetime Bin Health (Collected vs Overflowing)
    const binStats = await db
      .select({
        fillStatus: routeBins.fillStatus,
        count: sql<number>`count(*)`
      })
      .from(routeBins)
      .innerJoin(routes, eq(routeBins.routeId, routes.id))
      .where(eq(routes.driverId, driverId))
      .groupBy(routeBins.fillStatus);

    let collected = 0;
    let overflowing = 0;
    
    binStats.forEach(stat => {
      if (stat.fillStatus === 'collected') collected = Number(stat.count);
      if (stat.fillStatus === 'overflowing') overflowing = Number(stat.count);
    });

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
        total: collected + overflowing,
        overflowRatio: collected + overflowing > 0 
            ? Math.round((overflowing / (collected + overflowing)) * 100) 
            : 0
      },
      weeklyVelocity
    });

  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return res.status(500).json({ error: 'Failed to fetch driver stats' });
  }
};

