import { Router } from 'express';
import { getDrivers, createDriver , getDriverStats } from '../controllers/users.js';
import { requireAdmin, requireDriverOrAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/drivers', requireAdmin, getDrivers);
router.post('/drivers', requireAdmin, createDriver);
router.get('/drivers/:driverId/stats', requireDriverOrAdmin, getDriverStats);
export default router;