import { pool } from '../config/db';
import { InvoiceStatus } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IInvoiceLineItem {
  id?: string;
  name: string;
  qty: number;
  unitPrice: number;
  gst: number;
  total: number;
}

export interface IInvoiceTaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface IBankDetails {
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
}

export interface IInvoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  vendorId: string;
  lineItems?: IInvoiceLineItem[];
  taxBreakdown: IInvoiceTaxBreakdown;
  subtotal: number;
  grandTotal: number;
  bankDetails: IBankDetails;
  paymentTerms: string;
  dueDate: Date | null;
  status: InvoiceStatus;
  sentAt: Date | null;
  paidAt: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const Invoice = {
  async findById(id: string): Promise<IInvoice | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM invoices WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    const invoice: IInvoice = {
      id: row.id,
      invoiceNumber: row.invoice_number,
      poId: row.po_id,
      vendorId: row.vendor_id,
      subtotal: Number(row.subtotal),
      grandTotal: Number(row.grand_total),
      taxBreakdown: {
        cgst: Number(row.cgst),
        sgst: Number(row.sgst),
        igst: Number(row.igst),
        totalTax: Number(row.total_tax),
      },
      bankDetails: {
        bankName: row.bank_name || '',
        accountNo: row.account_no || '',
        ifsc: row.ifsc || '',
        branch: row.bank_branch || '',
      },
      paymentTerms: row.payment_terms || '',
      dueDate: row.due_date,
      status: row.status,
      sentAt: row.sent_at,
      paidAt: row.paid_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Load line items
    const [items] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM invoice_line_items WHERE invoice_id = ?',
      [id]
    );
    invoice.lineItems = items.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      unitPrice: Number(item.unit_price),
      gst: Number(item.gst),
      total: Number(item.total),
    }));

    return invoice;
  },

  async create(invoice: {
    invoiceNumber: string;
    poId: string;
    vendorId: string;
    lineItems: IInvoiceLineItem[];
    bankDetails?: IBankDetails;
    paymentTerms?: string;
    dueDate?: Date;
    status?: InvoiceStatus;
  }): Promise<IInvoice> {
    const id = require('crypto').randomUUID();
    const status = invoice.status || 'Draft';
    const paymentTerms = invoice.paymentTerms || '';
    const dueDate = invoice.dueDate || null;
    const bank = invoice.bankDetails || { bankName: '', accountNo: '', ifsc: '', branch: '' };

    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const computedItems = invoice.lineItems.map(item => {
      const lineSubtotal = item.unitPrice * item.qty;
      const taxAmount = lineSubtotal * (item.gst / 100);
      const lineTotal = lineSubtotal + taxAmount;

      subtotal += lineSubtotal;
      totalTax += taxAmount;
      grandTotal += lineTotal;

      // Split tax evenly between CGST and SGST
      cgst += taxAmount / 2;
      sgst += taxAmount / 2;

      return {
        ...item,
        total: lineTotal,
      };
    });

    await pool.query<ResultSetHeader>(
      `INSERT INTO invoices (
        id, invoice_number, po_id, vendor_id, subtotal, cgst, sgst, igst, total_tax, grand_total, 
        bank_name, account_no, ifsc, bank_branch, payment_terms, due_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, invoice.invoiceNumber, invoice.poId, invoice.vendorId, subtotal, cgst, sgst, igst, totalTax, grandTotal,
        bank.bankName, bank.accountNo, bank.ifsc, bank.branch, paymentTerms, dueDate, status
      ]
    );

    for (const item of computedItems) {
      const itemId = require('crypto').randomUUID();
      await pool.query(
        `INSERT INTO invoice_line_items (id, invoice_id, name, qty, unit_price, gst, total) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, id, item.name, item.qty, item.unitPrice, item.gst, item.total]
      );
    }

    const created = await this.findById(id);
    if (!created) throw new Error('Invoice creation failed');
    return created;
  },

  async update(id: string, updates: Partial<IInvoice>): Promise<IInvoice | null> {
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMapping: Record<string, string> = {
      paymentTerms: 'payment_terms',
      dueDate: 'due_date',
      status: 'status',
      sentAt: 'sent_at',
      paidAt: 'paid_at',
    };

    for (const [key, val] of Object.entries(updates)) {
      if (fieldMapping[key]) {
        fields.push(`${fieldMapping[key]} = ?`);
        values.push(val);
      }
    }

    if (updates.bankDetails) {
      fields.push('bank_name = ?', 'account_no = ?', 'ifsc = ?', 'bank_branch = ?');
      values.push(
        updates.bankDetails.bankName,
        updates.bankDetails.accountNo,
        updates.bankDetails.ifsc,
        updates.bankDetails.branch
      );
    }

    if (updates.status === 'Sent') {
      fields.push('sent_at = ?');
      values.push(new Date());
    } else if (updates.status === 'Paid') {
      fields.push('paid_at = ?');
      values.push(new Date());
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    return this.findById(id);
  }
};
