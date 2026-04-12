import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

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