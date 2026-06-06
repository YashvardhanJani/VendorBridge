import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate as any, getDashboardStats);

export default router;
