import { pool } from '../config/db';
import { ActivityEntityType } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IActivityLog {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  performedBy: string;
  details: string;
  createdAt: Date;
}

export const ActivityLog = {
  async create(log: {
    entityType: ActivityEntityType;
    entityId: string;
    action: string;
    performedBy: string;
    details?: string;
  }): Promise<IActivityLog> {
    const id = require('crypto').randomUUID();
    const details = log.details || '';

    await pool.query<ResultSetHeader>(
      `INSERT INTO activity_logs (id, entity_type, entity_id, action, performed_by, details) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, log.entityType, log.entityId, log.action, log.performedBy, details]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM activity_logs WHERE id = ?',
      [id]
    );
    return rows[0] as IActivityLog;
  },

  async find(filter: {
    entityType?: ActivityEntityType;
    limit?: number;
    offset?: number;
  }): Promise<IActivityLog[]> {
    let query = 'SELECT * FROM activity_logs';
    const params: any[] = [];

    if (filter.entityType) {
      query += ' WHERE entity_type = ?';
      params.push(filter.entityType);
    }

    query += ' ORDER BY created_at DESC';

    if (filter.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
      if (filter.offset) {
        query += ' OFFSET ?';
        params.push(filter.offset);
      }
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as IActivityLog[];
  }
};
