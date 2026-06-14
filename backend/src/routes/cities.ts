import { Router } from 'express';
import { getCities, createCity, deleteCity } from '../controllers/cities.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAdmin, getCities);
router.post('/', requireAdmin, createCity);
router.delete('/:cityId', requireAdmin, deleteCity);

export default router;
