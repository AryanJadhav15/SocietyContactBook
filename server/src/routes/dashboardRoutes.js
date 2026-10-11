import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dashboard } from '../controllers/dashboardController.js';

const router = Router();

router.get('/', asyncHandler(dashboard));

export default router;
