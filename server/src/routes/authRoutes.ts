import { Router } from 'express';
import { signup, login, me } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../validators/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

// Authenticated routes
router.get('/me', authenticate as any, me);

export default router;
