import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { idParam } from '../validators/commonSchemas.js';
import { contactListSchema, createContactSchema, updateContactSchema } from '../validators/contactSchemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as controller from '../controllers/contactController.js';

const router = Router();

router.get('/', validate(contactListSchema), asyncHandler(controller.listContacts));
router.get('/:id', validate(idParam), asyncHandler(controller.getContact));
router.post('/', requireRole('SOCIETY_ADMIN'), upload.single('photograph'), validate(createContactSchema), asyncHandler(controller.createContact));
router.put('/:id', requireRole('SOCIETY_ADMIN'), upload.single('photograph'), validate(updateContactSchema), asyncHandler(controller.updateContact));
router.patch('/:id/deactivate', requireRole('SOCIETY_ADMIN'), validate(idParam), asyncHandler(controller.deactivateContact));

export default router;
