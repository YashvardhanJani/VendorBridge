import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { logger } from '../config/logger';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const notifications = await Notification.findByUser(req.user.id);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    const success = await Notification.markAsRead(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const count = await Notification.markAllAsRead(req.user.id);
    res.status(200).json({ success: true, count });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
