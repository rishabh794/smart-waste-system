import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { bins } from '../db/schema/index.js';

export const getAllBins = async (req: Request, res: Response) => {
  try {
    const allBins = await db.select().from(bins);
    res.status(200).json(allBins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
};