import { Router } from 'express';
import { getAllBins, createBin } from '../controllers/bins.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAdmin,  getAllBins);
router.post('/', requireAdmin, createBin);
export default router;