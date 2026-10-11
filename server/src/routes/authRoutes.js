import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema, setupSchema } from '../validators/authSchemas.js';
import { currentUser, loginUser, logoutUser, setup } from '../controllers/authController.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: true, legacyHeaders: false });

router.post('/setup', authLimiter, validate(setupSchema), asyncHandler(setup));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(loginUser));
router.post('/logout', requireAuth, asyncHandler(logoutUser));
router.get('/me', requireAuth, asyncHandler(currentUser));

export default router;
