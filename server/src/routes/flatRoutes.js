import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/commonSchemas.js';
import { createFlatSchema, flatListSchema, updateFlatSchema } from '../validators/flatSchemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as controller from '../controllers/flatController.js';

const router = Router();

router.get('/', validate(flatListSchema), asyncHandler(controller.listFlats));
router.post('/', requireRole('SOCIETY_ADMIN'), validate(createFlatSchema), asyncHandler(controller.createFlat));
router.put('/:id', requireRole('SOCIETY_ADMIN'), validate(updateFlatSchema), asyncHandler(controller.updateFlat));
router.get('/:id/contacts', validate(idParam), asyncHandler(controller.getFlatContacts));

export default router;
