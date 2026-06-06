import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus
} from '../controllers/invoiceController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../validators/invoice';

const router = Router();

// Protect all routes with auth
router.use(authenticate as any);

// GET /api/invoices - List invoices
router.get('/', getInvoices);

// GET /api/invoices/:id - Get details
router.get('/:id', getInvoiceById);

// POST /api/invoices - Vendor generates invoice from PO
router.post('/', authorize('Vendor') as any, validate(createInvoiceSchema) as any, createInvoice);

// PUT /api/invoices/:id/status - Update invoice status
router.put('/:id/status', validate(updateInvoiceStatusSchema) as any, updateInvoiceStatus);

export default router;
