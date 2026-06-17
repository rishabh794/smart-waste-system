import { Router } from 'express';
import {
  createReport,
  getAllReports,
  getMyReports,
  updateReportStatus,
  deleteReport,
} from '../controllers/reports.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createReport);
router.get('/mine', requireAuth, getMyReports);
router.get('/', requireAdmin, getAllReports);
router.patch('/:reportId/status', requireAdmin, updateReportStatus);
router.delete('/:reportId', requireAuth, deleteReport);

export default router;
