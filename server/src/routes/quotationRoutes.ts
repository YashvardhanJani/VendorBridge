import { Router } from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation
} from '../controllers/quotationController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuotationSchema, updateQuotationSchema } from '../validators/quotation';

const router = Router();

// Protect all routes with auth
router.use(authenticate as any);

// GET /api/quotations - List filtered by rfqId or status
router.get('/', getQuotations);

// GET /api/quotations/:id - Single details
router.get('/:id', getQuotationById);

// POST /api/quotations - Submit bid (only Vendors)
router.post('/', authorize('Vendor') as any, validate(createQuotationSchema) as any, createQuotation);

// PUT /api/quotations/:id - Update bid status/fields
router.put('/:id', validate(updateQuotationSchema) as any, updateQuotation);

export default router;
