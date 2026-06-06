import { pool } from '../config/db';
import { ApprovalStatus } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IApprovalTimelineEntry {
  id?: string;
  status: string;
  userId: string;
  note?: string;
  createdAt: Date;
}

export interface IApproval {
  id: string;
  quotationId: string;
  rfqId: string;
  requestedBy: string;
  approvedBy: string | null;
  status: ApprovalStatus;
  remarks: string;
  timeline?: IApprovalTimelineEntry[];
  created_at: Date;
  updated_at: Date;
}

export const Approval = {
  async findById(id: string): Promise<IApproval | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM approvals WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    const app: IApproval = {
      id: row.id,
      quotationId: row.quotation_id,
      rfqId: row.rfq_id,
      requestedBy: row.requested_by,
      approvedBy: row.approved_by,
      status: row.status,
      remarks: row.remarks || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Load timeline
    const [timeline] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM approval_timeline WHERE approval_id = ? ORDER BY created_at ASC',
      [id]
    );
    app.timeline = timeline.map(entry => ({
      id: entry.id,
      status: entry.status,
      userId: entry.user_id,
      note: entry.note || '',
      createdAt: entry.created_at,
    }));

    return app;
  },

  async create(approval: {
    quotationId: string;
    rfqId: string;
    requestedBy: string;
    status?: ApprovalStatus;
  }): Promise<IApproval> {
    const id = require('crypto').randomUUID();
    const status = approval.status || 'Pending';

    await pool.query<ResultSetHeader>(
      `INSERT INTO approvals (id, quotation_id, rfq_id, requested_by, status, remarks) 
       VALUES (?, ?, ?, ?, ?, '')`,
      [id, approval.quotationId, approval.rfqId, approval.requestedBy, status]
    );

    // Initial timeline entry
    const timelineId = require('crypto').randomUUID();
    await pool.query(
      'INSERT INTO approval_timeline (id, approval_id, status, user_id, note) VALUES (?, ?, ?, ?, ?)',
      [timelineId, id, 'Pending', approval.requestedBy, 'Approval request initiated']
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Approval creation failed');
    return created;
  },

  async updateStatus(
    id: string,
    status: ApprovalStatus,
    userId: string,
    remarks: string = '',
    note: string = ''
  ): Promise<IApproval | null> {
    const approvedBy = ['Approved', 'Rejected'].includes(status) ? userId : null;

    await pool.query(
      'UPDATE approvals SET status = ?, approved_by = ?, remarks = ? WHERE id = ?',
      [status, approvedBy, remarks, id]
    );

    const timelineId = require('crypto').randomUUID();
    await pool.query(
      'INSERT INTO approval_timeline (id, approval_id, status, user_id, note) VALUES (?, ?, ?, ?, ?)',
      [timelineId, id, status, userId, note || remarks]
    );

    return this.findById(id);
  }
};
