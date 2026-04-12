import { Router } from 'express';
import { getDrivers, createDriver } from '../controllers/users.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/drivers', requireAdmin, getDrivers);
router.post('/drivers', requireAdmin, createDriver);
export default router;