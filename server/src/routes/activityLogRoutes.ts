import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', getActivityLogs);

export default router;
