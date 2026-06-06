import { Router } from 'express';
import {
  getRfqs,
  getRfqById,
  createRfq,
  updateRfq,
  inviteVendors
} from '../controllers/rfqController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRfqSchema, updateRfqSchema } from '../validators/rfq';

const router = Router();

// Protect all routes with auth
router.use(authenticate as any);

// GET /api/rfqs - List with search/filter
router.get('/', getRfqs);

// GET /api/rfqs/:id - Single details
router.get('/:id', getRfqById);

// POST /api/rfqs - Create
router.post('/', authorize('Admin', 'Officer') as any, validate(createRfqSchema) as any, createRfq);

// PUT /api/rfqs/:id - Update
router.put('/:id', authorize('Admin', 'Officer') as any, validate(updateRfqSchema) as any, updateRfq);

// POST /api/rfqs/:id/invite - Invite vendors
router.post('/:id/invite', authorize('Admin', 'Officer') as any, inviteVendors);

export default router;
