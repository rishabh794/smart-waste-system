import { Router } from 'express';
import { getDriverTodayRoute , updateBinStatus , createRoute, completeRoute
, getPendingRoutes
 } from '../controllers/routes.js';
import { requireAdmin, requireDriverOrAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/driver/:driverId', requireDriverOrAdmin, getDriverTodayRoute);
router.patch('/:routeId/bins/:binId/status', requireDriverOrAdmin, updateBinStatus);
router.post('/', requireAdmin, createRoute);
router.patch('/:routeId/status', requireDriverOrAdmin, completeRoute);
router.get('/pending', requireAdmin, getPendingRoutes);

export default router;