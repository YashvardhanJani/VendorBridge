import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';
import { logger } from '../config/logger';
import { UserRole } from '../utils/constants';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUser;
}

interface JWTPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Middleware: Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ success: false, error: 'Internal server error' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid token. User not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired. Please login again.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token.' });
      return;
    }
    logger.error('Authentication error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Middleware factory: Restrict access to specific roles
 * Usage: authorize('Admin', 'Manager')
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};
