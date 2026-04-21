import { Router } from 'express';
import { getAllBins, createBin, updateBinConditionStatus } from '../controllers/bins.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAdmin,  getAllBins);
router.post('/', requireAdmin, createBin);
router.patch('/:binId/status', requireAdmin, updateBinConditionStatus);
export default router;