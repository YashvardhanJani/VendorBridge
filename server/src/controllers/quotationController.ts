import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { Quotation } from '../models/Quotation';
import { Notification } from '../models/Notification';
import { RFQ } from '../models/RFQ';
import { logger } from '../config/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getQuotations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const rfqId = req.query.rfqId as string | undefined;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT q.*, v.company_name as vendor_name, r.ref_number as rfq_ref, r.title as rfq_title
      FROM quotations q
      JOIN vendors v ON q.vendor_id = v.id
      JOIN rfqs r ON q.rfq_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role === 'Vendor') {
      // Vendors can only view their own quotations
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0) {
        res.status(200).json({ success: true, quotations: [] });
        return;
      }
      query += ' AND q.vendor_id = ?';
      params.push(vendors[0].id);
    }

    if (rfqId) {
      query += ' AND q.rfq_id = ?';
      params.push(rfqId);
    }

    if (status) {
      query += ' AND q.status = ?';
      params.push(status);
    }

    query += ' ORDER BY q.submitted_at DESC, q.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    // For pricing consistency, cast total_amount to number
    const formatted = rows.map(r => ({
      ...r,
      total_amount: Number(r.total_amount),
      delivery_days: Number(r.delivery_days),
    }));

    res.status(200).json({ success: true, quotations: formatted });
  } catch (error) {
    logger.error('Error fetching quotations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getQuotationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const quoteId = req.params.id as string;

    const quote = await Quotation.findById(quoteId);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }

    // Role checks
    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0 || vendors[0].id !== quote.vendorId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    // Fetch extra vendor and RFQ metadata
    const [vendorRows] = await pool.query<RowDataPacket[]>('SELECT company_name FROM vendors WHERE id = ?', [quote.vendorId]);
    const [rfqRows] = await pool.query<RowDataPacket[]>('SELECT ref_number, title FROM rfqs WHERE id = ?', [quote.rfqId]);

    const result = {
      ...quote,
      vendorName: vendorRows[0]?.company_name || 'Unknown',
      rfqRef: rfqRows[0]?.ref_number || 'Unknown',
      rfqTitle: rfqRows[0]?.title || 'Unknown',
    };

    res.status(200).json({ success: true, quotation: result });
  } catch (error) {
    logger.error('Error fetching quotation details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    if (role !== 'Vendor') {
      res.status(403).json({ success: false, error: 'Access denied. Only vendors can submit quotations.' });
      return;
    }

    const { rfqId, deliveryDays, notes, status, lineItems } = req.body;

    // 1. Fetch vendor account
    const [vendors] = await pool.query<RowDataPacket[]>('SELECT id, company_name FROM vendors WHERE user_id = ?', [userId]);
    if (vendors.length === 0) {
      res.status(403).json({ success: false, error: 'Access denied. No registered vendor profile found.' });
      return;
    }
    const vendorId = vendors[0].id;
    const vendorName = vendors[0].company_name;

    // 2. Verify RFQ assignment
    const [assignment] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ?',
      [rfqId, vendorId]
    );
    if (assignment.length === 0) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You have not been assigned/invited to submit a quotation for this RFQ.',
      });
      return;
    }

    // 3. Verify RFQ deadline and status
    const [rfqRows] = await pool.query<RowDataPacket[]>('SELECT title, deadline, status, created_by FROM rfqs WHERE id = ?', [rfqId]);
    if (rfqRows.length === 0) {
      res.status(404).json({ success: false, error: 'RFQ not found' });
      return;
    }

    const rfq = rfqRows[0];
    if (rfq.status === 'Draft' || rfq.status === 'Closed' || rfq.status === 'Approved') {
      res.status(400).json({ success: false, error: `Bidding is closed for this RFQ (status: ${rfq.status})` });
      return;
    }

    if (new Date() > new Date(rfq.deadline)) {
      res.status(400).json({ success: false, error: 'Bidding deadline has passed for this RFQ' });
      return;
    }

    // 4. Check if already submitted
    const existing = await Quotation.findByRfqAndVendor(rfqId, vendorId);
    let result;
    if (existing) {
      // Overwrite/update existing
      result = await Quotation.update(existing.id, {
        deliveryDays,
        notes,
        status: status || 'Submitted',
        lineItems,
      });
      await RFQ.logActivity(rfqId, 'Quote Updated', userId, `Vendor ${vendorName} updated their quotation`);
    } else {
      // Create new
      result = await Quotation.create({
        rfqId,
        vendorId,
        lineItems,
        deliveryDays,
        notes,
        status: status || 'Submitted',
      });
      await RFQ.logActivity(rfqId, 'Quote Submitted', userId, `Vendor ${vendorName} submitted a quotation`);
    }

    // 5. Update RFQ status to 'Quotes Received' if currently in 'Awaiting Quotes' or 'Published'
    if (rfq.status === 'Published' || rfq.status === 'Awaiting Quotes') {
      await pool.query('UPDATE rfqs SET status = ? WHERE id = ?', ['Quotes Received', rfqId]);
    }

    // 6. Notify RFQ creator
    if (status !== 'Draft') {
      await Notification.create({
        userId: rfq.created_by,
        title: 'Quotation Received',
        message: `${vendorName} submitted a quotation for: ${rfq.title}`,
        type: 'info',
        link: `/rfqs/${rfqId}`,
      });
    }

    res.status(201).json({ success: true, quotation: result });
  } catch (error) {
    logger.error('Error submitting quotation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateQuotation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const quoteId = req.params.id as string;
    const updates = req.body;

    const existing = await Quotation.findById(quoteId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }

    // Access checks
    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0 || vendors[0].id !== existing.vendorId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
      
      // Check RFQ deadline
      const [rfqRows] = await pool.query<RowDataPacket[]>('SELECT deadline, status FROM rfqs WHERE id = ?', [existing.rfqId]);
      if (rfqRows.length > 0) {
        const rfq = rfqRows[0];
        if (new Date() > new Date(rfq.deadline) || rfq.status === 'Closed') {
          res.status(400).json({ success: false, error: 'Bidding is closed, updates not allowed' });
          return;
        }
      }
    } else {
      // Officers/Managers can only update the status of the quote (e.g. to Selected or Rejected)
      // They are not allowed to change deliveryDays, notes, or lineItems!
      delete updates.deliveryDays;
      delete updates.notes;
      delete updates.lineItems;
    }

    const updated = await Quotation.update(quoteId, updates);

    res.status(200).json({ success: true, quotation: updated });
  } catch (error) {
    logger.error('Error updating quotation:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
