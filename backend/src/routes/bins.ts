import { Router } from 'express';
import { getAllBins } from '../controllers/bins.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAdmin,  getAllBins);
export default router;