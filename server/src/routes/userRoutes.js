import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createUserSchema, updateUserSchema } from '../validators/userSchemas.js';
import * as controller from '../controllers/userController.js';

const router = Router();
router.use(requireRole('SOCIETY_ADMIN'));

router.get('/', asyncHandler(controller.listUsers));
router.post('/', validate(createUserSchema), asyncHandler(controller.createUser));
router.put('/:id', validate(updateUserSchema), asyncHandler(controller.updateUser));

export default router;
