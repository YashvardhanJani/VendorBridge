import { pool } from '../config/db';
import { QuotationStatus } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IQuotationLineItem {
  id?: string;
  itemName: string;
  unitPrice: number;
  qty: number;
  total: number;
}

export interface IQuotation {
  id: string;
  rfqId: string;
  vendorId: string;
  lineItems?: IQuotationLineItem[];
  deliveryDays: number;
  totalAmount: number;
  notes: string;
  status: QuotationStatus;
  submittedAt: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const Quotation = {
  async findById(id: string): Promise<IQuotation | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM quotations WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    const q: IQuotation = {
      id: row.id,
      rfqId: row.rfq_id,
      vendorId: row.vendor_id,
      deliveryDays: row.delivery_days,
      totalAmount: Number(row.total_amount),
      notes: row.notes,
      status: row.status,
      submittedAt: row.submitted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Load line items
    const [items] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM quotation_line_items WHERE quotation_id = ?',
      [id]
    );
    q.lineItems = items.map(item => ({
      id: item.id,
      itemName: item.item_name,
      unitPrice: Number(item.unit_price),
      qty: item.qty,
      total: Number(item.total),
    }));

    return q;
  },

  async findByRfqAndVendor(rfqId: string, vendorId: string): Promise<IQuotation | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM quotations WHERE rfq_id = ? AND vendor_id = ?',
      [rfqId, vendorId]
    );
    if (rows.length === 0) return null;
    return this.findById(rows[0].id);
  },

  async create(q: {
    rfqId: string;
    vendorId: string;
    lineItems: Omit<IQuotationLineItem, 'total'>[];
    deliveryDays: number;
    notes?: string;
    status?: QuotationStatus;
  }): Promise<IQuotation> {
    const id = require('crypto').randomUUID();
    const status = q.status || 'Submitted';
    const notes = q.notes || '';
    const submittedAt = status === 'Submitted' ? new Date() : null;

    // Calculate line item totals and totalAmount
    let totalAmount = 0;
    const computedItems = q.lineItems.map(item => {
      const total = item.unitPrice * item.qty;
      totalAmount += total;
      return { ...item, total };
    });

    // Insert Quotation
    await pool.query<ResultSetHeader>(
      `INSERT INTO quotations (id, rfq_id, vendor_id, delivery_days, total_amount, notes, status, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, q.rfqId, q.vendorId, q.deliveryDays, totalAmount, notes, status, submittedAt]
    );

    // Insert line items
    for (const item of computedItems) {
      const itemId = require('crypto').randomUUID();
      await pool.query(
        `INSERT INTO quotation_line_items (id, quotation_id, item_name, unit_price, qty, total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, id, item.itemName, item.unitPrice, item.qty, item.total]
      );
    }

    const created = await this.findById(id);
    if (!created) throw new Error('Quotation creation failed');
    return created;
  },

  async update(id: string, updates: Partial<IQuotation>): Promise<IQuotation | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMapping: Record<string, string> = {
      deliveryDays: 'delivery_days',
      notes: 'notes',
      status: 'status',
    };

    for (const [key, val] of Object.entries(updates)) {
      if (fieldMapping[key]) {
        fields.push(`${fieldMapping[key]} = ?`);
        values.push(val);
      }
    }

    // If status is updated to Submitted, update submittedAt
    if (updates.status === 'Submitted') {
      fields.push('submitted_at = ?');
      values.push(new Date());
    }

    // If lineItems are updated, recalculate totalAmount
    if (updates.lineItems) {
      await pool.query('DELETE FROM quotation_line_items WHERE quotation_id = ?', [id]);
      let totalAmount = 0;
      for (const item of updates.lineItems) {
        const itemId = require('crypto').randomUUID();
        const total = item.unitPrice * item.qty;
        totalAmount += total;
        await pool.query(
          `INSERT INTO quotation_line_items (id, quotation_id, item_name, unit_price, qty, total) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [itemId, id, item.itemName, item.unitPrice, item.qty, total]
        );
      }
      fields.push('total_amount = ?');
      values.push(totalAmount);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE quotations SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    return this.findById(id);
  }
};
