import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as controller from '../controllers/referenceController.js';

const router = Router();

router.get('/', asyncHandler(controller.listReferences));
router.post('/categories/:categoryId/subcategories', requireRole('SOCIETY_ADMIN'), asyncHandler(controller.createSubcategory));
router.post('/services', requireRole('SOCIETY_ADMIN'), asyncHandler(controller.createService));
router.post('/work-types', requireRole('SOCIETY_ADMIN'), asyncHandler(controller.createWorkType));

export default router;
