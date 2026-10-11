import mysql from 'mysql2/promise';
import { env } from './env.js';

export const sqlPool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 10,
  namedPlaceholders: true
});
