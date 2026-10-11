import { Prisma } from '@prisma/client';
import { env, isProduction } from '../config/env.js';

export function notFoundHandler(_req, _res, next) {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let message = error.message || 'Unexpected server error';
  let details = error.details;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      status = 409;
      message = 'A record with these unique values already exists';
    } else if (error.code === 'P2003') {
      status = 400;
      message = 'The request references a related record that does not exist';
    }
  }

  if (status >= 500 && isProduction) {
    message = 'Unexpected server error';
    details = undefined;
  }

  if (env.NODE_ENV !== 'test' && status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    success: false,
    error: { message, details }
  });
}
