import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { logger } from '../config/logger';
import { AuthRequest } from '../middleware/auth';

const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'vendorbridge_jwt_secret_2025_do_not_share';
  const expires = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, role }, secret, { expiresIn: expires as any });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, error: 'Email already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
    });

    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.created_at.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Me endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
