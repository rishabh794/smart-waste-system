import { Router } from 'express';
import authRoutes from './auth.js';
import binRoutes from './bins.js';
import routeRoutes from './routes.js';
import userRoutes from './users.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bins', binRoutes);
router.use('/routes', routeRoutes);
router.use('/users', userRoutes);

export default router;