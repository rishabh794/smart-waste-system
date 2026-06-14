import { Router } from 'express';
import authRoutes from './auth.js';
import binRoutes from './bins.js';
import routeRoutes from './routes.js';
import reportRoutes from './reports.js';
import userRoutes from './users.js';
import cityRoutes from './cities.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bins', binRoutes);
router.use('/routes', routeRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/cities', cityRoutes);

export default router;
