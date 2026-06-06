import { Router } from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  toggleVendorStatus
} from '../controllers/vendorController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createVendorSchema, updateVendorSchema } from '../validators/vendor';

const router = Router();

// Protect all routes with auth
router.use(authenticate as any);

// GET /api/vendors - List with search/filter
router.get('/', authorize('Admin', 'Officer', 'Manager') as any, getVendors);

// GET /api/vendors/:id - Single details
router.get('/:id', authorize('Admin', 'Officer', 'Manager', 'Vendor') as any, getVendorById);

// POST /api/vendors - Create
router.post('/', authorize('Admin', 'Officer') as any, validate(createVendorSchema) as any, createVendor);

// PUT /api/vendors/:id - Update
router.put('/:id', authorize('Admin', 'Officer') as any, validate(updateVendorSchema) as any, updateVendor);

// DELETE /api/vendors/:id - Delete
router.delete('/:id', authorize('Admin') as any, deleteVendor);

// PATCH /api/vendors/:id/status - Toggle status
router.patch('/:id/status', authorize('Admin', 'Officer') as any, toggleVendorStatus);

export default router;
