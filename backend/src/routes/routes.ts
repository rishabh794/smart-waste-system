import { Router } from 'express';
import { getDriverTodayRoute , updateBinStatus } from '../controllers/routes.js';

const router = Router();
router.get('/driver/:driverId', getDriverTodayRoute);
router.patch('/:routeId/bins/:binId/status', updateBinStatus);

export default router;