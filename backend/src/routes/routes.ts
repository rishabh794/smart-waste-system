import { Router } from 'express';
import { getDriverTodayRoute } from '../controllers/routes.js';
const router = Router();
router.get('/driver/:driverId', getDriverTodayRoute);
export default router;