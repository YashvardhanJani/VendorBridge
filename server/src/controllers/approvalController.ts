import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { Approval } from '../models/Approval';
import { Quotation } from '../models/Quotation';
import { RFQ } from '../models/RFQ';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Notification } from '../models/Notification';
import { logger } from '../config/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT a.*, 
             u.name as requester_name, 
             r.ref_number as rfq_ref, 
             r.title as rfq_title, 
             v.company_name as vendor_name, 
             q.total_amount as quotation_amount
      FROM approvals a
      JOIN users u ON a.requested_by = u.id
      JOIN rfqs r ON a.rfq_id = r.id
      JOIN quotations q ON a.quotation_id = q.id
      JOIN vendors v ON q.vendor_id = v.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role === 'Officer') {
      // Officers only see approvals they requested
      query += ' AND a.requested_by = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Format fields
    const formatted = rows.map(r => ({
      ...r,
      quotation_amount: Number(r.quotation_amount)
    }));

    res.status(200).json({ success: true, approvals: formatted });
  } catch (error) {
    logger.error('Error fetching approvals:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getApprovalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const approvalId = req.params.id as string;
    const approval = await Approval.findById(approvalId);
    if (!approval) {
      res.status(404).json({ success: false, error: 'Approval request not found' });
      return;
    }

    // Role checks
    const { id: userId, role } = req.user;
    if (role === 'Officer' && approval.requestedBy !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Fetch related detailed details (Quotation line items, vendor stats, RFQ details)
    const quote = await Quotation.findById(approval.quotationId);
    const [vendorRows] = await pool.query<RowDataPacket[]>(
      'SELECT company_name, gst, category, rating FROM vendors WHERE id = ?',
      [quote?.vendorId]
    );
    const rfq = await RFQ.findById(approval.rfqId);

    const detail = {
      ...approval,
      requesterName: (await pool.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ?', [approval.requestedBy]))[0][0]?.name || 'Unknown',
      decidedByName: approval.approvedBy ? (await pool.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ?', [approval.approvedBy]))[0][0]?.name : null,
      vendor: vendorRows[0] || null,
      quotation: quote,
      rfq: rfq
    };

    res.status(200).json({ success: true, approval: detail });
  } catch (error) {
    logger.error('Error fetching approval details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const submitApprovalRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    if (role !== 'Officer' && role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Access denied. Only officers can trigger approvals.' });
      return;
    }

    const { quotationId } = req.body;

    // 1. Fetch quotation
    const quote = await Quotation.findById(quotationId);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }

    if (quote.status !== 'Submitted' && quote.status !== 'Selected') {
      res.status(400).json({ success: false, error: 'Only Submitted or Selected quotations can be sent for approval review.' });
      return;
    }

    // 2. Check if approval already initiated
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id, status FROM approvals WHERE quotation_id = ?',
      [quotationId]
    );
    if (existing.length > 0) {
      res.status(400).json({ success: false, error: `Approval workflow is already in progress (status: ${existing[0].status})` });
      return;
    }

    // 3. Update Quotation Status to Selected
    await pool.query('UPDATE quotations SET status = ? WHERE id = ?', ['Selected', quotationId]);

    // 4. Create Approval Workflow
    const approval = await Approval.create({
      quotationId,
      rfqId: quote.rfqId,
      requestedBy: userId,
      status: 'Pending',
    });

    // 5. Transition RFQ status to Under Review
    await pool.query('UPDATE rfqs SET status = ? WHERE id = ?', ['Under Review', quote.rfqId]);
    await RFQ.logActivity(quote.rfqId, 'Under Review', userId, 'RFQ submitted to Management for Quotation approval');

    // 6. Notify all Managers
    const [managers] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE role = ?', ['Manager']);
    const [rfqRows] = await pool.query<RowDataPacket[]>('SELECT ref_number, title FROM rfqs WHERE id = ?', [quote.rfqId]);
    const rfqRef = rfqRows[0]?.ref_number || 'RFQ';

    for (const manager of managers) {
      await Notification.create({
        userId: manager.id,
        title: 'New Approval Request',
        message: `Officer requested quotation approval for RFQ ${rfqRef}: ${rfqRows[0]?.title}`,
        type: 'warning',
        link: `/approvals/${approval.id}`,
      });
    }

    res.status(201).json({ success: true, approval });
  } catch (error) {
    logger.error('Error submitting approval request:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const reviewApprovalRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    if (role !== 'Manager' && role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Access denied. Only managers or administrators can review approvals.' });
      return;
    }

    const approvalId = req.params.id as string;
    const { status, remarks } = req.body; // Approved or Rejected or Under Review

    const approval = await Approval.findById(approvalId);
    if (!approval) {
      res.status(404).json({ success: false, error: 'Approval request not found' });
      return;
    }

    if (approval.status === 'Approved' || approval.status === 'Rejected') {
      res.status(400).json({ success: false, error: `This approval request is already finalized: ${approval.status}` });
      return;
    }

    if (status === 'Rejected' && (!remarks || !remarks.trim())) {
      res.status(400).json({ success: false, error: 'Remarks are mandatory when rejecting an approval request.' });
      return;
    }

    // Perform state transition
    const note = `Reviewed by ${role} with remarks: ${remarks}`;
    const updated = await Approval.updateStatus(approvalId, status, userId, remarks, note);

    // Side effects
    if (status === 'Approved') {
      // 1. Update RFQ status to Approved
      await pool.query('UPDATE rfqs SET status = ? WHERE id = ?', ['Approved', approval.rfqId]);
      await RFQ.logActivity(approval.rfqId, 'Approved', userId, `RFQ selection approved by Manager. Remarks: ${remarks}`);

      // 2. Shortlist quotation as Selected, mark all other quotations for this RFQ as Rejected
      await pool.query('UPDATE quotations SET status = ? WHERE rfq_id = ? AND id = ?', ['Selected', approval.rfqId, approval.quotationId]);
      await pool.query('UPDATE quotations SET status = ? WHERE rfq_id = ? AND id != ?', ['Rejected', approval.rfqId, approval.quotationId]);

      // 3. Auto-generate Purchase Order (Phase 9 Integration)
      // Get sequential PO number VB-PO-YYYY-NNN
      const currentYear = new Date().getFullYear();
      const yearPattern = `VB-PO-${currentYear}-%`;
      const [poRows] = await pool.query<RowDataPacket[]>(
        'SELECT po_number FROM purchase_orders WHERE po_number LIKE ? ORDER BY created_at DESC LIMIT 1',
        [yearPattern]
      );

      let sequence = 1;
      if (poRows.length > 0) {
        const lastNum = poRows[0].po_number;
        const parts = lastNum.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
      const poSeqStr = String(sequence).padStart(3, '0');
      const poNumber = `VB-PO-${currentYear}-${poSeqStr}`;

      // Get quotation items and vendor
      const quote = await Quotation.findById(approval.quotationId);
      if (quote) {
        const poItems = (quote.lineItems || []).map(item => ({
          name: item.itemName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          gst: 18 // standard 18% GST split as standard default
        }));

        const po = await PurchaseOrder.create({
          poNumber,
          quotationId: approval.quotationId,
          rfqId: approval.rfqId,
          vendorId: quote.vendorId,
          items: poItems,
          deliveryAddress: 'Main Warehouse Block, Corporate HQ',
          terms: 'Standard Net 30. Delivery within stipulated SLA days.'
        });

        // 4. Set RFQ status to PO Generated
        await pool.query('UPDATE rfqs SET status = ? WHERE id = ?', ['PO Generated', approval.rfqId]);
        await RFQ.logActivity(approval.rfqId, 'PO Generated', userId, `Purchase Order ${poNumber} generated automatically from approved quotation.`);

        // 5. Notify Vendor of Purchase Order
        const [vendorUser] = await pool.query<RowDataPacket[]>('SELECT user_id FROM vendors WHERE id = ?', [quote.vendorId]);
        if (vendorUser[0]?.user_id) {
          await Notification.create({
            userId: vendorUser[0].user_id,
            title: 'Purchase Order Issued',
            message: `A new Purchase Order ${poNumber} has been issued for your bid proposal!`,
            type: 'success',
            link: `/purchase-orders/${po.id}`,
          });
        }
      }

      // Notify Requester (Officer)
      await Notification.create({
        userId: approval.requestedBy,
        title: 'Quotation Approved',
        message: `Your quotation selection has been approved! PO generated.`,
        type: 'success',
        link: `/approvals/${approvalId}`,
      });

    } else if (status === 'Rejected') {
      // Update RFQ status to Rejected
      await pool.query('UPDATE rfqs SET status = ? WHERE id = ?', ['Rejected', approval.rfqId]);
      await RFQ.logActivity(approval.rfqId, 'Rejected', userId, `Quotation selection rejected by Manager. Remarks: ${remarks}`);

      // Revert Quotation status to Submitted so it can be re-evaluated
      await pool.query('UPDATE quotations SET status = ? WHERE id = ?', ['Submitted', approval.quotationId]);

      // Notify Requester (Officer)
      await Notification.create({
        userId: approval.requestedBy,
        title: 'Quotation Rejected',
        message: `Your quotation selection request was rejected by Manager. Remarks: ${remarks}`,
        type: 'error',
        link: `/approvals/${approvalId}`,
      });
    }

    res.status(200).json({ success: true, approval: updated });
  } catch (error) {
    logger.error('Error reviewing approval request:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
