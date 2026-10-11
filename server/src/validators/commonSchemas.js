import { z } from 'zod';

export const idParam = z.object({
  params: z.object({ id: z.coerce.number().int().positive() })
});

export const phoneSchema = z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number');

export const enumValue = (values) => z.enum(values);

export const paginationQuery = {
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
};
