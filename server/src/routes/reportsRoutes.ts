import { Router } from 'express';
import { getReportsData } from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/data', getReportsData);

export default router;
