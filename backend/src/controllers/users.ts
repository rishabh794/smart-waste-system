import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
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