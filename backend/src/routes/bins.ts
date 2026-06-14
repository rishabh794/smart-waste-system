import { Router } from 'express';
import { getAllBins, createBin, updateBinConditionStatus, getNearbyBin } from '../controllers/bins.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

// Citizen-accessible: must be registered before any /:param routes
router.get('/nearby', requireAuth, getNearbyBin);

router.get('/', requireAdmin,  getAllBins);
router.post('/', requireAdmin, createBin);
router.patch('/:binId/status', requireAdmin, updateBinConditionStatus);
export default router;