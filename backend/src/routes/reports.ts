import { Router } from 'express';
import {
  createReport,
  getAllReports,
  getMyReports,
  updateReportStatus,
} from '../controllers/reports.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createReport);
router.get('/mine', requireAuth, getMyReports);
router.get('/', requireAdmin, getAllReports);
router.patch('/:reportId/status', requireAdmin, updateReportStatus);

export default router;
