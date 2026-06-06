import { pool } from '../config/db';
import { VendorStatus, VendorCategory, VendorDocType } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IVendorDocument {
  id?: string;
  vendor_id?: string;
  name: string;
  url: string;
  type: VendorDocType;
}

export interface IVendor {
  id: string;
  user_id: string | null;
  company_name: string;
  gst: string;
  category: VendorCategory;
  contact_email: string;
  phone: string;
  address: string;
  status: VendorStatus;
  rating: number;
  documents?: IVendorDocument[];
  created_at: Date;
  updated_at: Date;
}

export const Vendor = {
  async findById(id: string): Promise<IVendor | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM vendors WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;

    const vendor = rows[0] as IVendor;

    // Load documents
    const [docs] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM vendor_documents WHERE vendor_id = ?',
      [id]
    );
    vendor.documents = docs as IVendorDocument[];

    return vendor;
  },

  async findByGst(gst: string): Promise<IVendor | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM vendors WHERE gst = ?',
      [gst]
    );
    if (rows.length === 0) return null;
    return rows[0] as IVendor;
  },

  async create(vendor: {
    user_id?: string | null;
    companyName: string;
    gst: string;
    category: VendorCategory;
    contactEmail: string;
    phone: string;
    address: string;
    status?: VendorStatus;
    documents?: IVendorDocument[];
  }): Promise<IVendor> {
    const id = require('crypto').randomUUID();
    const status = vendor.status || 'Active';
    const userId = vendor.user_id || null;

    await pool.query<ResultSetHeader>(
      `INSERT INTO vendors (id, user_id, company_name, gst, category, contact_email, phone, address, status, rating) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00)`,
      [id, userId, vendor.companyName, vendor.gst, vendor.category, vendor.contactEmail, vendor.phone, vendor.address, status]
    );

    if (vendor.documents && vendor.documents.length > 0) {
      for (const doc of vendor.documents) {
        const docId = require('crypto').randomUUID();
        await pool.query(
          'INSERT INTO vendor_documents (id, vendor_id, name, url, type) VALUES (?, ?, ?, ?, ?)',
          [docId, id, doc.name, doc.url, doc.type]
        );
      }
    }

    const created = await this.findById(id);
    if (!created) throw new Error('Vendor creation failed');
    return created;
  },

  async update(id: string, updates: Partial<IVendor>): Promise<IVendor | null> {
    const fields: string[] = [];
    const values: any[] = [];

    // Map camelCase fields from controllers to snake_case DB columns if needed,
    // or direct updates if they match. Let's support both.
    const fieldMapping: Record<string, string> = {
      companyName: 'company_name',
      company_name: 'company_name',
      gst: 'gst',
      category: 'category',
      contactEmail: 'contact_email',
      contact_email: 'contact_email',
      phone: 'phone',
      address: 'address',
      status: 'status',
      rating: 'rating',
      userId: 'user_id',
      user_id: 'user_id'
    };

    for (const [key, val] of Object.entries(updates)) {
      if (fieldMapping[key] && key !== 'documents') {
        fields.push(`${fieldMapping[key]} = ?`);
        values.push(val);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    if (updates.documents) {
      // Delete old docs and insert new ones
      await pool.query('DELETE FROM vendor_documents WHERE vendor_id = ?', [id]);
      for (const doc of updates.documents) {
        const docId = require('crypto').randomUUID();
        await pool.query(
          'INSERT INTO vendor_documents (id, vendor_id, name, url, type) VALUES (?, ?, ?, ?, ?)',
          [docId, id, doc.name, doc.url, doc.type]
        );
      }
    }

    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM vendors WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};
