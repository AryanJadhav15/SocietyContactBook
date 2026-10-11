import { Router } from 'express';
import authRoutes from './authRoutes.js';
import contactRoutes from './contactRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import flatRoutes from './flatRoutes.js';
import referenceRoutes from './referenceRoutes.js';
import userRoutes from './userRoutes.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);
router.use('/contacts', requireAuth, contactRoutes);
router.use('/flats', requireAuth, flatRoutes);
router.use('/references', requireAuth, referenceRoutes);
router.use('/users', requireAuth, userRoutes);

export default router;
