import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24, 'JWT_SECRET must be at least 24 characters'),
  COOKIE_NAME: z.string().default('society_contact_session'),
  SETUP_TOKEN: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(2 * 1024 * 1024)
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
