import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(10).max(128),
    role: z.enum(['SOCIETY_ADMIN', 'RESIDENT']).default('RESIDENT'),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(['SOCIETY_ADMIN', 'RESIDENT']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
