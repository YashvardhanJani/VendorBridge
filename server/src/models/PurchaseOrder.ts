import { pool } from '../config/db';
import { POStatus } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IPOItem {
  id?: string;
  name: string;
  qty: number;
  unitPrice: number;
  gst: number;
  total: number;
}

export interface ITaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface IPurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  rfqId: string;
  vendorId: string;
  items?: IPOItem[];
  deliveryAddress: string;
  terms: string;
  grandTotal: number;
  taxBreakdown: ITaxBreakdown;
  status: POStatus;
  created_at: Date;
  updated_at: Date;
}

export const PurchaseOrder = {
  async findById(id: string): Promise<IPurchaseOrder | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    const po: IPurchaseOrder = {
      id: row.id,
      poNumber: row.po_number,
      quotationId: row.quotation_id,
      rfqId: row.rfq_id,
      vendorId: row.vendor_id,
      deliveryAddress: row.delivery_address || '',
      terms: row.terms || '',
      grandTotal: Number(row.grand_total),
      taxBreakdown: {
        cgst: Number(row.cgst),
        sgst: Number(row.sgst),
        igst: Number(row.igst),
      },
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Load items
    const [items] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM po_items WHERE po_id = ?',
      [id]
    );
    po.items = items.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      unitPrice: Number(item.unit_price),
      gst: Number(item.gst),
      total: Number(item.total),
    }));

    return po;
  },

  async create(po: {
    poNumber: string;
    quotationId: string;
    rfqId: string;
    vendorId: string;
    items: Omit<IPOItem, 'total'>[];
    deliveryAddress?: string;
    terms?: string;
  }): Promise<IPurchaseOrder> {
    const id = require('crypto').randomUUID();
    const deliveryAddress = po.deliveryAddress || '';
    const terms = po.terms || '';

    // Calculate item totals and grandTotal / tax breakdown
    let grandTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const computedItems = po.items.map(item => {
      const subtotal = item.unitPrice * item.qty;
      // We assume GST is a percentage rate, e.g. 18.
      // Total includes GST amount.
      const gstAmount = subtotal * (item.gst / 100);
      const total = subtotal + gstAmount;

      grandTotal += total;
      // Simple tax split (assuming standard CGST+SGST = 9%+9% if local, or IGST if interstate)
      // Here we will calculate CGST/SGST as half of GST if it is split, or IGST as full.
      // We can check if GST is 18, and set CGST 9% and SGST 9%. Let's just split evenly by default.
      cgstTotal += gstAmount / 2;
      sgstTotal += gstAmount / 2;

      return {
        ...item,
        total,
      };
    });

    // Insert PO
    await pool.query<ResultSetHeader>(
      `INSERT INTO purchase_orders (id, po_number, quotation_id, rfq_id, vendor_id, delivery_address, terms, grand_total, cgst, sgst, igst, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Issued')`,
      [id, po.poNumber, po.quotationId, po.rfqId, po.vendorId, deliveryAddress, terms, grandTotal, cgstTotal, sgstTotal, igstTotal]
    );

    // Insert items
    for (const item of computedItems) {
      const itemId = require('crypto').randomUUID();
      await pool.query(
        `INSERT INTO po_items (id, po_id, name, qty, unit_price, gst, total) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, id, item.name, item.qty, item.unitPrice, item.gst, item.total]
      );
    }

    const created = await this.findById(id);
    if (!created) throw new Error('Purchase order creation failed');
    return created;
  },

  async updateStatus(id: string, status: POStatus): Promise<IPurchaseOrder | null> {
    await pool.query(
      'UPDATE purchase_orders SET status = ? WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }
};
