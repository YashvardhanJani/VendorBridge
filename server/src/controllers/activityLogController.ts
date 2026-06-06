import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';
import { logger } from '../config/logger';

export const getActivityLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { entityType } = req.query;
    let query = `
      SELECT al.*, u.name as performed_by_name 
      FROM activity_logs al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (entityType) {
      query += ' AND al.entity_type = ?';
      params.push(entityType);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 100';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.status(200).json({ success: true, logs: rows });
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
