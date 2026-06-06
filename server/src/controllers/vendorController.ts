import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { Vendor } from '../models/Vendor';
import { ActivityLog } from '../models/ActivityLog';
import { logger } from '../config/logger';
import { RowDataPacket } from 'mysql2';

export const getVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const isExport = req.query.export as string | undefined;
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '10';

    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (company_name LIKE ? OR gst LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY company_name ASC';

    if (isExport === 'true') {
      const [rows] = await pool.query<RowDataPacket[]>(query, params);
      res.status(200).json({ success: true, vendors: rows });
      return;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
    const [[countResult]] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countResult.count;

    // Fetch paginated
    query += ' LIMIT ? OFFSET ?';
    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limitNum, offset]);

    res.status(200).json({
      success: true,
      vendors: rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getVendorById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }
    res.status(200).json({ success: true, vendor });
  } catch (error) {
    logger.error('Error fetching vendor:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyName, gst, category, contactEmail, phone, address, status, documents } = req.body;
    const performedBy = (req.user?.id as string) || 'system';

    // Check if GST already exists
    const existing = await Vendor.findByGst(gst);
    if (existing) {
      res.status(400).json({ success: false, error: 'A vendor with this GST number already exists' });
      return;
    }

    const created = await Vendor.create({
      companyName,
      gst,
      category,
      contactEmail,
      phone,
      address,
      status,
      documents,
    });

    // Log activity
    await ActivityLog.create({
      entityType: 'Vendor',
      entityId: created.id,
      action: 'Vendor Registered',
      performedBy,
      details: `Registered company ${companyName} (${category})`,
    });

    res.status(201).json({ success: true, vendor: created });
  } catch (error) {
    logger.error('Error creating vendor:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updates = req.body;
    const performedBy = (req.user?.id as string) || 'system';

    const existing = await Vendor.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    // Check GST uniqueness if updating GST
    if (updates.gst && updates.gst !== existing.gst) {
      const duplicate = await Vendor.findByGst(updates.gst);
      if (duplicate) {
        res.status(400).json({ success: false, error: 'A vendor with this GST number already exists' });
        return;
      }
    }

    const updated = await Vendor.update(id, updates);

    // Log activity
    await ActivityLog.create({
      entityType: 'Vendor',
      entityId: id,
      action: 'Vendor Updated',
      performedBy,
      details: `Updated details for ${existing.company_name}`,
    });

    res.status(200).json({ success: true, vendor: updated });
  } catch (error) {
    logger.error('Error updating vendor:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const performedBy = (req.user?.id as string) || 'system';

    const existing = await Vendor.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    await Vendor.delete(id);

    // Log activity
    await ActivityLog.create({
      entityType: 'Vendor',
      entityId: id,
      action: 'Vendor Deleted',
      performedBy,
      details: `Deleted vendor company ${existing.company_name}`,
    });

    res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vendor:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const toggleVendorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const performedBy = (req.user?.id as string) || 'system';

    const existing = await Vendor.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Vendor not found' });
      return;
    }

    const updated = await Vendor.update(id, { status });

    await ActivityLog.create({
      entityType: 'Vendor',
      entityId: id,
      action: 'Vendor Status Changed',
      performedBy,
      details: `Status of ${existing.company_name} changed to ${status}`,
    });

    res.status(200).json({ success: true, vendor: updated });
  } catch (error) {
    logger.error('Error changing vendor status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
