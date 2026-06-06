import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { RFQ } from '../models/RFQ';
import { Notification } from '../models/Notification';
import { logger } from '../config/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getRfqs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '10';

    let query = '';
    const params: any[] = [];

    if (role === 'Vendor') {
      // Find vendor corresponding to user
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0) {
        // Unregistered/unassociated vendor sees nothing
        res.status(200).json({ success: true, rfqs: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
        return;
      }
      const vendorId = vendors[0].id;

      // Vendors only see assigned RFQs that are NOT Draft
      query = `
        SELECT r.* FROM rfqs r
        JOIN rfq_vendors rv ON r.id = rv.rfq_id
        WHERE rv.vendor_id = ? AND r.status != 'Draft'
      `;
      params.push(vendorId);
    } else {
      // Officers, Managers, and Admins see all RFQs
      query = 'SELECT r.* FROM rfqs r WHERE 1=1';
    }

    if (search) {
      query += ' AND (r.title LIKE ? OR r.ref_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Count query
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [[countResult]] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countResult.count;

    // Paginated
    query += ' LIMIT ? OFFSET ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limitNum, offset]);

    res.status(200).json({
      success: true,
      rfqs: rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching RFQs:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getRfqById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const rfqId = req.params.id as string;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      res.status(404).json({ success: false, error: 'RFQ not found' });
      return;
    }

    // Role checks
    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
      const vendorId = vendors[0].id;
      if (!rfq.assignedVendors || !rfq.assignedVendors.includes(vendorId)) {
        res.status(403).json({ success: false, error: 'Access denied. You are not assigned to this RFQ' });
        return;
      }
      if (rfq.status === 'Draft') {
        res.status(403).json({ success: false, error: 'Access denied. This RFQ is not published' });
        return;
      }
    }

    res.status(200).json({ success: true, rfq });
  } catch (error) {
    logger.error('Error fetching RFQ:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createRfq = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, deadline, status, items, assignedVendors, attachments } = req.body;
    const createdBy = (req.user?.id as string) || 'system';

    // Generate RFQ ref_number: RFQ-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [[maxRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM rfqs WHERE ref_number LIKE ?",
      [`RFQ-${dateStr}-%`]
    );
    const seq = (maxRow.count + 1).toString().padStart(3, '0');
    const refNumber = `RFQ-${dateStr}-${seq}`;

    const created = await RFQ.create({
      refNumber,
      title,
      description,
      deadline: new Date(deadline),
      status: status || 'Draft',
      items,
      assignedVendors,
      attachments,
      createdBy,
    });

    // If published, notify assigned vendors
    if (status === 'Published' || status === 'Awaiting Quotes') {
      if (assignedVendors && assignedVendors.length > 0) {
        for (const vendorId of assignedVendors) {
          const [vRows] = await pool.query<RowDataPacket[]>('SELECT user_id FROM vendors WHERE id = ?', [vendorId]);
          if (vRows.length > 0 && vRows[0].user_id) {
            await Notification.create({
              userId: vRows[0].user_id,
              title: 'New RFQ Published',
              message: `You have been invited to submit a quote for: ${title}`,
              type: 'info',
              link: `/rfqs/${created.id}`,
            });
          }
        }
      }
    }

    res.status(201).json({ success: true, rfq: created });
  } catch (error) {
    logger.error('Error creating RFQ:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateRfq = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rfqId = req.params.id as string;
    const updates = req.body;
    const userId = (req.user?.id as string) || 'system';

    const existing = await RFQ.findById(rfqId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'RFQ not found' });
      return;
    }

    if (updates.deadline) {
      updates.deadline = new Date(updates.deadline);
    }

    const updated = await RFQ.update(rfqId, updates);

    // Activity Log
    let logNote = 'RFQ fields updated';
    if (updates.status && updates.status !== existing.status) {
      logNote = `Status changed from ${existing.status} to ${updates.status}`;
      
      // If status changed to Published/Awaiting Quotes, send notifications
      if (updates.status === 'Published' || updates.status === 'Awaiting Quotes') {
        const assigned = updated?.assignedVendors || existing.assignedVendors || [];
        for (const vendorId of assigned) {
          const [vRows] = await pool.query<RowDataPacket[]>('SELECT user_id FROM vendors WHERE id = ?', [vendorId]);
          if (vRows.length > 0 && vRows[0].user_id) {
            await Notification.create({
              userId: vRows[0].user_id,
              title: 'RFQ Published',
              message: `You are invited to quote for: ${existing.title}`,
              type: 'info',
              link: `/rfqs/${rfqId}`,
            });
          }
        }
      }
    }

    await RFQ.logActivity(rfqId, 'Updated', userId, logNote);

    res.status(200).json({ success: true, rfq: updated });
  } catch (error) {
    logger.error('Error updating RFQ:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const inviteVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rfqId = req.params.id as string;
    const { vendorIds } = req.body; // array of vendor IDs
    const userId = (req.user?.id as string) || 'system';

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      res.status(404).json({ success: false, error: 'RFQ not found' });
      return;
    }

    const currentAssigned = rfq.assignedVendors || [];
    const newInvited: string[] = [];

    for (const vendorId of vendorIds) {
      if (!currentAssigned.includes(vendorId)) {
        await pool.query(
          'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)',
          [rfqId, vendorId]
        );
        newInvited.push(vendorId);

        // Notify vendor
        const [vRows] = await pool.query<RowDataPacket[]>('SELECT user_id FROM vendors WHERE id = ?', [vendorId]);
        if (vRows.length > 0 && vRows[0].user_id) {
          await Notification.create({
            userId: vRows[0].user_id,
            title: 'New RFQ Invitation',
            message: `You have been invited to quote for RFQ: ${rfq.title}`,
            type: 'info',
            link: `/rfqs/${rfqId}`,
          });
        }
      }
    }

    if (newInvited.length > 0) {
      await RFQ.logActivity(
        rfqId,
        'Vendors Invited',
        userId,
        `Invited ${newInvited.length} new vendors to submit quotes`
      );
    }

    const updated = await RFQ.findById(rfqId);
    res.status(200).json({ success: true, rfq: updated });
  } catch (error) {
    logger.error('Error inviting vendors to RFQ:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
