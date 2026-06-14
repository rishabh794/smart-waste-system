import type { Request, Response } from 'express';
import { db } from '../db/db.js';
import { cities, users, bins } from '../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import {
  createCityBodySchema,
  cityIdParamsSchema,
  getValidationErrorMessage,
} from '../validation/schemas.js';

export const getCities = async (req: Request, res: Response) => {
  try {
    const allCities = await db
      .select({
        id: cities.id,
        name: cities.name,
        depotLat: cities.depotLat,
        depotLng: cities.depotLng,
      })
      .from(cities)
      .orderBy(cities.name);

    res.status(200).json(allCities);
  } catch (error) {
    console.error('Fetch cities error:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

export const createCity = async (req: Request, res: Response): Promise<any> => {
  const parsedBody = createCityBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedBody.error) });
  }

  const { name, depotLat, depotLng } = parsedBody.data;

  try {
    const [newCity] = await db
      .insert(cities)
      .values({ name, depotLat: depotLat ?? null, depotLng: depotLng ?? null })
      .returning({
        id: cities.id,
        name: cities.name,
        depotLat: cities.depotLat,
        depotLng: cities.depotLng,
      });

    return res.status(201).json(newCity);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'A city with this name already exists.' });
    }

    console.error('Create city error:', error);
    return res.status(500).json({ error: 'Failed to create city' });
  }
};

export const deleteCity = async (req: Request, res: Response): Promise<any> => {
  const parsedParams = cityIdParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ error: getValidationErrorMessage(parsedParams.error) });
  }

  const { cityId } = parsedParams.data;

  try {
    // Check for drivers assigned to this city
    const [driverCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.cityId, cityId));

    if (Number(driverCount?.count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete city: drivers are still assigned to it.',
      });
    }

    // Check for bins assigned to this city
    const [binCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bins)
      .where(eq(bins.cityId, cityId));

    if (Number(binCount?.count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete city: bins are still assigned to it.',
      });
    }

    const [deletedCity] = await db
      .delete(cities)
      .where(eq(cities.id, cityId))
      .returning({ id: cities.id });

    if (!deletedCity) {
      return res.status(404).json({ error: 'City not found' });
    }

    return res.status(200).json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Delete city error:', error);
    return res.status(500).json({ error: 'Failed to delete city' });
  }
};
