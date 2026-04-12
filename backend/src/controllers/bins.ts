import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { bins , routeBins} from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export const getAllBins = async (req: Request, res: Response) => {
  try {
    const allBins = await db.select({
      id: bins.id,
      latitude: bins.latitude,
      longitude: bins.longitude,
      zone: bins.zone,
      status: routeBins.fillStatus 
    })
    .from(bins)
    .leftJoin(routeBins, eq(bins.id, routeBins.binId));
    // If a bin has been in multiple routes, this ensures we only keep one unique copy
    const uniqueBinsMap = new Map();
    for (const bin of allBins) {
      uniqueBinsMap.set(bin.id, bin);
    }
    const uniqueBins = Array.from(uniqueBinsMap.values());

    res.status(200).json(uniqueBins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
};