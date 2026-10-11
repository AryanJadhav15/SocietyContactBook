import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const setupSchema = z.object({
  body: z.object({
    societyName: z.string().trim().min(2).max(160),
    societyCode: z.string().trim().min(2).max(40).regex(/^[A-Z0-9_-]+$/i),
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(10).max(128)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});
