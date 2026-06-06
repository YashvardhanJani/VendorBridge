import { pool } from '../config/db';
import { REF_PREFIXES } from './constants';
import { logger } from '../config/logger';
import { RowDataPacket } from 'mysql2';

type RefType = 'RFQ' | 'PO' | 'INVOICE';

const tableMap: Record<RefType, { table: string; field: string }> = {
  RFQ: { table: 'rfqs', field: 'ref_number' },
  PO: { table: 'purchase_orders', field: 'po_number' },
  INVOICE: { table: 'invoices', field: 'invoice_number' },
};

/**
 * Generate auto-incrementing reference numbers.
 * Format: VB-{TYPE}-{YYYY}-{NNN}
 * Example: VB-RFQ-2025-001, VB-PO-2025-042, VB-INV-2025-007
 */
export const generateRefNumber = async (type: RefType): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = REF_PREFIXES[type];
  const { table, field } = tableMap[type];

  try {
    const pattern = `${prefix}-${year}-`;
    
    // Find the latest document for the current year
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${field} FROM ${table} WHERE ${field} LIKE ? ORDER BY ${field} DESC LIMIT 1`,
      [`${pattern}%`]
    );

    let nextNumber = 1;
    if (rows.length > 0) {
      const currentRef = rows[0][field] as string;
      const parts = currentRef.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = String(nextNumber).padStart(3, '0');
    return `${prefix}-${year}-${paddedNumber}`;
  } catch (error) {
    logger.error(`Failed to generate ref number for ${type}:`, error);
    // Fallback: use timestamp-based number
    const fallback = Date.now().toString().slice(-4);
    return `${prefix}-${year}-${fallback}`;
  }
};
