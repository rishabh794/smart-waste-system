import { Router } from 'express';
import { getDrivers } from '../controllers/users.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/drivers', requireAdmin, getDrivers);
export default router;