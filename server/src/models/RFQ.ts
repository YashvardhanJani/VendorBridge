import { pool } from '../config/db';
import { RFQStatus } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IRFQItem {
  id?: string;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  specNotes?: string;
}

export interface IRFQAttachment {
  id?: string;
  name: string;
  url: string;
}

export interface IRFQActivityEntry {
  id?: string;
  action: string;
  user_id: string;
  at?: Date;
  note?: string;
}

export interface IRFQ {
  id: string;
  ref_number: string;
  title: string;
  description: string;
  deadline: Date;
  status: RFQStatus;
  items?: IRFQItem[];
  assignedVendors?: string[];
  attachments?: IRFQAttachment[];
  created_by: string;
  activityLog?: IRFQActivityEntry[];
  created_at: Date;
  updated_at: Date;
}

export const RFQ = {
  async findById(id: string): Promise<IRFQ | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rfqs WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;

    const rfq = rows[0] as IRFQ;

    // Load items
    const [items] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rfq_items WHERE rfq_id = ?',
      [id]
    );
    rfq.items = items as IRFQItem[];

    // Load attachments
    const [attachments] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rfq_attachments WHERE rfq_id = ?',
      [id]
    );
    rfq.attachments = attachments as IRFQAttachment[];

    // Load assigned vendors
    const [vendors] = await pool.query<RowDataPacket[]>(
      'SELECT vendor_id FROM rfq_vendors WHERE rfq_id = ?',
      [id]
    );
    rfq.assignedVendors = vendors.map(v => v.vendor_id);

    // Load activity log
    const [logs] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rfq_activity_log WHERE rfq_id = ? ORDER BY created_at ASC',
      [id]
    );
    rfq.activityLog = logs.map(l => ({
      id: l.id,
      action: l.action,
      user_id: l.user_id,
      at: l.created_at,
      note: l.note
    })) as IRFQActivityEntry[];

    return rfq;
  },

  async create(rfq: {
    refNumber: string;
    title: string;
    description?: string;
    deadline: Date;
    status?: RFQStatus;
    items: IRFQItem[];
    assignedVendors?: string[];
    attachments?: IRFQAttachment[];
    createdBy: string;
  }): Promise<IRFQ> {
    const id = require('crypto').randomUUID();
    const status = rfq.status || 'Draft';
    const description = rfq.description || '';

    // Insert main RFQ
    await pool.query<ResultSetHeader>(
      `INSERT INTO rfqs (id, ref_number, title, description, deadline, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, rfq.refNumber, rfq.title, description, rfq.deadline, status, rfq.createdBy]
    );

    // Insert items
    for (const item of rfq.items) {
      const itemId = require('crypto').randomUUID();
      await pool.query(
        `INSERT INTO rfq_items (id, rfq_id, name, description, qty, unit, spec_notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, id, item.name, item.description || '', item.qty, item.unit, item.specNotes || '']
      );
    }

    // Insert vendor assignments
    if (rfq.assignedVendors && rfq.assignedVendors.length > 0) {
      for (const vendorId of rfq.assignedVendors) {
        await pool.query(
          'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)',
          [id, vendorId]
        );
      }
    }

    // Insert attachments
    if (rfq.attachments && rfq.attachments.length > 0) {
      for (const attach of rfq.attachments) {
        const attachId = require('crypto').randomUUID();
        await pool.query(
          'INSERT INTO rfq_attachments (id, rfq_id, name, url) VALUES (?, ?, ?, ?)',
          [attachId, id, attach.name, attach.url]
        );
      }
    }

    // Log initial activity
    const activityId = require('crypto').randomUUID();
    await pool.query(
      'INSERT INTO rfq_activity_log (id, rfq_id, action, user_id, note) VALUES (?, ?, ?, ?, ?)',
      [activityId, id, 'Created', rfq.createdBy, 'RFQ Created']
    );

    const created = await this.findById(id);
    if (!created) throw new Error('RFQ creation failed');
    return created;
  },

  async update(id: string, updates: Partial<IRFQ> & { 
    refNumber?: string;
    createdBy?: string;
  }): Promise<IRFQ | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      deadline: 'deadline',
      status: 'status',
      refNumber: 'ref_number',
      ref_number: 'ref_number',
      createdBy: 'created_by',
      created_by: 'created_by'
    };

    for (const [key, val] of Object.entries(updates)) {
      if (fieldMapping[key] && key !== 'items' && key !== 'assignedVendors' && key !== 'attachments') {
        fields.push(`${fieldMapping[key]} = ?`);
        values.push(val);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE rfqs SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update items if provided
    if (updates.items) {
      await pool.query('DELETE FROM rfq_items WHERE rfq_id = ?', [id]);
      for (const item of updates.items) {
        const itemId = require('crypto').randomUUID();
        await pool.query(
          `INSERT INTO rfq_items (id, rfq_id, name, description, qty, unit, spec_notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, id, item.name, item.description || '', item.qty, item.unit, item.specNotes || '']
        );
      }
    }

    // Update assigned vendors if provided
    if (updates.assignedVendors) {
      await pool.query('DELETE FROM rfq_vendors WHERE rfq_id = ?', [id]);
      for (const vendorId of updates.assignedVendors) {
        await pool.query(
          'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)',
          [id, vendorId]
        );
      }
    }

    // Update attachments if provided
    if (updates.attachments) {
      await pool.query('DELETE FROM rfq_attachments WHERE rfq_id = ?', [id]);
      for (const attach of updates.attachments) {
        const attachId = require('crypto').randomUUID();
        await pool.query(
          'INSERT INTO rfq_attachments (id, rfq_id, name, url) VALUES (?, ?, ?, ?)',
          [attachId, id, attach.name, attach.url]
        );
      }
    }

    return this.findById(id);
  },

  async logActivity(id: string, action: string, userId: string, note: string = ''): Promise<void> {
    const activityId = require('crypto').randomUUID();
    await pool.query(
      'INSERT INTO rfq_activity_log (id, rfq_id, action, user_id, note) VALUES (?, ?, ?, ?, ?)',
      [activityId, id, action, userId, note]
    );
  }
};
