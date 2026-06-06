import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', getNotifications);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:id/read', markNotificationAsRead);

export default router;
