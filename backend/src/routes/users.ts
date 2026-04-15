import { Router } from 'express';
import { getDrivers, createDriver , getDriverStats } from '../controllers/users.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/drivers', requireAdmin, getDrivers);
router.post('/drivers', requireAdmin, createDriver);
router.get('/drivers/:driverId/stats', requireAuth, getDriverStats);
export default router;