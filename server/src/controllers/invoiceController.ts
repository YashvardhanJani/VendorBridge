import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { RFQ } from '../models/RFQ';
import { Notification } from '../models/Notification';
import { logger } from '../config/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Mock Email notification helper
const sendEmailMock = async (to: string, subject: string, text: string) => {
  logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
  logger.info(`[MOCK EMAIL BODY] ${text}`);
  // In the future, the user will wire up EmailJS / Nodemailer here
  return true;
};

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT i.*, 
             v.company_name as vendor_name, 
             po.po_number as po_ref
      FROM invoices i
      JOIN vendors v ON i.vendor_id = v.id
      JOIN purchase_orders po ON i.po_id = po.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0) {
        res.status(200).json({ success: true, invoices: [] });
        return;
      }
      query += ' AND i.vendor_id = ?';
      params.push(vendors[0].id);
    }

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    const formatted = rows.map(r => ({
      ...r,
      subtotal: Number(r.subtotal),
      grand_total: Number(r.grand_total),
      cgst: Number(r.cgst),
      sgst: Number(r.sgst),
      igst: Number(r.igst),
      total_tax: Number(r.total_tax)
    }));

    res.status(200).json({ success: true, invoices: formatted });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const invoiceId = req.params.id as string;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    const { id: userId, role } = req.user;
    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0 || vendors[0].id !== invoice.vendorId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    // Fetch related metadata
    const [vendorRows] = await pool.query<RowDataPacket[]>(
      'SELECT company_name, gst, category, contact_email FROM vendors WHERE id = ?',
      [invoice.vendorId]
    );
    const [poRows] = await pool.query<RowDataPacket[]>('SELECT po_number, rfq_id FROM purchase_orders WHERE id = ?', [invoice.poId]);

    const result = {
      ...invoice,
      vendorName: vendorRows[0]?.company_name || 'Unknown',
      vendorGst: vendorRows[0]?.gst || 'Unknown',
      vendorContactEmail: vendorRows[0]?.contact_email || '',
      poRef: poRows[0]?.po_number || 'Unknown',
      rfqId: poRows[0]?.rfq_id || ''
    };

    res.status(200).json({ success: true, invoice: result });
  } catch (error) {
    logger.error('Error fetching invoice details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id: userId, role } = req.user;
    if (role !== 'Vendor') {
      res.status(403).json({ success: false, error: 'Access denied. Only vendors can generate invoices.' });
      return;
    }

    const { poId, bankDetails, paymentTerms } = req.body;

    // 1. Fetch vendor account
    const [vendors] = await pool.query<RowDataPacket[]>('SELECT id, company_name FROM vendors WHERE user_id = ?', [userId]);
    if (vendors.length === 0) {
      res.status(403).json({ success: false, error: 'No registered vendor profile found' });
      return;
    }
    const vendorId = vendors[0].id;
    const vendorName = vendors[0].company_name;

    // 2. Fetch purchase order
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      res.status(404).json({ success: false, error: 'Purchase order not found' });
      return;
    }

    if (po.vendorId !== vendorId) {
      res.status(403).json({ success: false, error: 'Access denied. You do not own this purchase order.' });
      return;
    }

    // 3. Check if invoice already exists
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM invoices WHERE po_id = ?', [poId]);
    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'An invoice has already been generated for this purchase order' });
      return;
    }

    // 4. Generate sequential invoice number
    const currentYear = new Date().getFullYear();
    const yearPattern = `VB-INV-${currentYear}-%`;
    const [invRows] = await pool.query<RowDataPacket[]>(
      'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY created_at DESC LIMIT 1',
      [yearPattern]
    );

    let sequence = 1;
    if (invRows.length > 0) {
      const lastNum = invRows[0].invoice_number;
      const parts = lastNum.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    const invSeqStr = String(sequence).padStart(3, '0');
    const invoiceNumber = `VB-INV-${currentYear}-${invSeqStr}`;

    // 5. Build line items matching PO items
    const lineItems = (po.items || []).map(item => ({
      name: item.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      gst: item.gst,
      total: item.total
    }));

    // 6. Create Invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30-day default terms

    const created = await Invoice.create({
      invoiceNumber,
      poId,
      vendorId,
      lineItems,
      bankDetails: bankDetails || {
        bankName: 'HDFC Bank Ltd',
        accountNo: '50100234567891',
        ifsc: 'HDFC0001203',
        branch: 'TechPark Branch, Bangalore'
      },
      paymentTerms: paymentTerms || 'Net 30',
      dueDate,
      status: 'Sent' // Automatically transition to Sent when dispatched
    });

    // 7. Notify Officer/Creator of the RFQ
    const [rfqRows] = await pool.query<RowDataPacket[]>('SELECT created_by FROM rfqs WHERE id = ?', [po.rfqId]);
    const rfqCreator = rfqRows[0]?.created_by;
    if (rfqCreator) {
      await Notification.create({
        userId: rfqCreator,
        title: 'Invoice Submitted',
        message: `${vendorName} submitted invoice ${invoiceNumber} for PO ${po.poNumber}`,
        type: 'info',
        link: `/invoices/${created.id}`
      });

      // Fetch officer email
      const [officerRows] = await pool.query<RowDataPacket[]>('SELECT email FROM users WHERE id = ?', [rfqCreator]);
      if (officerRows[0]?.email) {
        await sendEmailMock(
          officerRows[0].email,
          `New Invoice Submitted: ${invoiceNumber}`,
          `Hi,\n\nVendor ${vendorName} has submitted a new invoice ${invoiceNumber} for your review. Total amount: INR ${created.grandTotal}.\n\nView details inside the portal: http://localhost:5173/invoices/${created.id}`
        );
      }
    }

    res.status(201).json({ success: true, invoice: created });
  } catch (error) {
    logger.error('Error generating invoice:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const invoiceId = req.params.id as string;
    const { status } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    const { id: userId, role } = req.user;

    // Access checks
    if (role === 'Vendor') {
      const [vendors] = await pool.query<RowDataPacket[]>('SELECT id FROM vendors WHERE user_id = ?', [userId]);
      if (vendors.length === 0 || vendors[0].id !== invoice.vendorId) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    const updated = await Invoice.update(invoiceId, { status });

    // Side effects: Notify Vendor if status is marked Paid
    if (status === 'Paid') {
      const [vendorRows] = await pool.query<RowDataPacket[]>('SELECT user_id, company_name, contact_email FROM vendors WHERE id = ?', [invoice.vendorId]);
      const vendorUserId = vendorRows[0]?.user_id;
      const vendorEmail = vendorRows[0]?.contact_email;
      const vendorName = vendorRows[0]?.company_name || 'Vendor';

      if (vendorUserId) {
        await Notification.create({
          userId: vendorUserId,
          title: 'Invoice Settlement Paid',
          message: `Your invoice ${invoice.invoiceNumber} has been successfully settled!`,
          type: 'success',
          link: `/invoices/${invoiceId}`
        });
      }

      if (vendorEmail) {
        await sendEmailMock(
          vendorEmail,
          `Invoice Settled: ${invoice.invoiceNumber}`,
          `Hi ${vendorName},\n\nWe are pleased to inform you that your invoice ${invoice.invoiceNumber} has been successfully paid.\n\nTotal paid: INR ${invoice.grandTotal}.\n\nThank you for your business!`
        );
      }
    }

    res.status(200).json({ success: true, invoice: updated });
  } catch (error) {
    logger.error('Error updating invoice status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
