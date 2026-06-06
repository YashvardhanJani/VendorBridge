import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../config/logger';

/**
 * Middleware factory: Validate request body against a Zod schema
 * Usage: validate(loginSchema)
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
        return;
      }
      logger.error('Validation middleware error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
};

/**
 * Middleware factory: Validate request query params against a Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details,
        });
        return;
      }
      logger.error('Query validation middleware error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
};
