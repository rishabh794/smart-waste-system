import { Router } from 'express';
import { getDriverTodayRoute , updateBinStatus , createRoute, completeRoute } from '../controllers/routes.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/driver/:driverId',requireAuth, getDriverTodayRoute);
router.patch('/:routeId/bins/:binId/status', updateBinStatus);
router.post('/', requireAdmin, createRoute);
router.patch('/:routeId/status', completeRoute);

export default router;