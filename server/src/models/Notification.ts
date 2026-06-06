import { pool } from '../config/db';
import { NotificationType } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link: string;
  createdAt: Date;
}

export const Notification = {
  async create(notif: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }): Promise<INotification> {
    const id = require('crypto').randomUUID();
    const type = notif.type || 'info';
    const link = notif.link || '';

    await pool.query<ResultSetHeader>(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link) 
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [id, notif.userId, notif.title, notif.message, type, link]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      read: row.is_read === 1,
      link: row.link,
      createdAt: row.created_at,
    };
  },

  async findByUser(userId: string, read?: boolean): Promise<INotification[]> {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [userId];

    if (read !== undefined) {
      query += ' AND is_read = ?';
      params.push(read ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      read: row.is_read === 1,
      link: row.link,
      createdAt: row.created_at,
    }));
  },

  async markAsRead(id: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.affectedRows;
  }
};
