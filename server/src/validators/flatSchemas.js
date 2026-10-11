import { z } from 'zod';
import { paginationQuery } from './commonSchemas.js';

export const flatListSchema = z.object({
  query: z.object({
    ...paginationQuery,
    search: z.string().trim().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional()
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional()
});

export const flatBody = z.object({
  building: z.string().trim().min(1).max(40),
  flatNumber: z.string().trim().min(1).max(40),
  floor: z.string().trim().max(20).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

export const createFlatSchema = z.object({
  body: flatBody,
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const updateFlatSchema = z.object({
  body: flatBody.partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
