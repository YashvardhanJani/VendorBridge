import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { RFQ } from '../models/RFQ';
import { Notification } from '../models/Notification';
import { logger } from '../config/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getPurchaseOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT po.*, 
             v.company_name as vendor_name, 
             r.ref_number as rfq_ref, 
             r.title as rfq_title
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.id
      JOIN rfqs r ON po.rfq_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0) {
        res.status(200).json({ success: true, purchaseOrders: [] });
        return;
      }
      query += ' AND po.vendor_id = ?';
      params.push(vendors[0].id);
    }

    if (status) {
      query += ' AND po.status = ?';
      params.push(status);
    }

    query += ' ORDER BY po.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    const formatted = rows.map(r => ({
      ...r,
      grand_total: Number(r.grand_total),
      cgst: Number(r.cgst),
      sgst: Number(r.sgst),
      igst: Number(r.igst)
    }));

    res.status(200).json({ success: true, purchaseOrders: formatted });
  } catch (error) {
    logger.error('Error fetching purchase orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getPurchaseOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const poId = req.params.id as string;
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      res.status(404).json({ success: false, error: 'Purchase order not found' });
      return;
    }

    const { id: userId, role } = req.user;
    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0 || vendors[0].id !== po.vendorId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    // Fetch related metadata
    const [vendorRows] = await pool.query<RowDataPacket[]>(
      'SELECT company_name, gst, category, phone, address FROM vendors WHERE id = ?',
      [po.vendorId]
    );
    const [rfqRows] = await pool.query<RowDataPacket[]>('SELECT ref_number, title FROM rfqs WHERE id = ?', [po.rfqId]);

    const result = {
      ...po,
      vendorName: vendorRows[0]?.company_name || 'Unknown',
      vendorGst: vendorRows[0]?.gst || 'Unknown',
      vendorAddress: vendorRows[0]?.address || 'Unknown',
      vendorPhone: vendorRows[0]?.phone || 'Unknown',
      rfqRef: rfqRows[0]?.ref_number || 'Unknown',
      rfqTitle: rfqRows[0]?.title || 'Unknown'
    };

    res.status(200).json({ success: true, purchaseOrder: result });
  } catch (error) {
    logger.error('Error fetching purchase order details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updatePurchaseOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const poId = req.params.id as string;
    const { status } = req.body;

    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      res.status(404).json({ success: false, error: 'Purchase order not found' });
      return;
    }

    const { id: userId, role } = req.user;
    
    // Authorization Check: Vendors can only update their own POs and transition them
    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0 || vendors[0].id !== po.vendorId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    // Update PO status
    const updated = await PurchaseOrder.updateStatus(poId, status);
    if (!updated) {
      res.status(400).json({ success: false, error: 'Failed to update PO status' });
      return;
    }

    // Log Activity
    await RFQ.logActivity(
      po.rfqId,
      `PO ${status}`,
      userId,
      `Purchase Order ${po.poNumber} status updated to: ${status} by user ${req.user.email}`
    );

    // Send notifications based on who updated
    const [rfqRows] = await pool.query<RowDataPacket[]>('SELECT created_by FROM rfqs WHERE id = ?', [po.rfqId]);
    const rfqCreator = rfqRows[0]?.created_by;

    const [vendorRows] = await pool.query<RowDataPacket[]>('SELECT user_id, company_name FROM vendors WHERE id = ?', [po.vendorId]);
    const vendorUserId = vendorRows[0]?.user_id;
    const vendorName = vendorRows[0]?.company_name || 'Vendor';

    if (role === 'Vendor') {
      // Notify RFQ Creator (Officer)
      if (rfqCreator) {
        await Notification.create({
          userId: rfqCreator,
          title: 'Purchase Order Delivered',
          message: `${vendorName} updated PO ${po.poNumber} status to: ${status}`,
          type: 'info',
          link: `/purchase-orders/${poId}`,
        });
      }
    } else {
      // Notify Vendor
      if (vendorUserId) {
        await Notification.create({
          userId: vendorUserId,
          title: 'Purchase Order Updated',
          message: `Procurement team updated your PO ${po.poNumber} status to: ${status}`,
          type: 'success',
          link: `/purchase-orders/${poId}`,
        });
      }
    }

    res.status(200).json({ success: true, purchaseOrder: updated });
  } catch (error) {
    logger.error('Error updating purchase order status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
