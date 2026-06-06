import { Router } from 'express';
import {
  getApprovals,
  getApprovalById,
  submitApprovalRequest,
  reviewApprovalRequest
} from '../controllers/approvalController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createApprovalSchema, reviewApprovalSchema } from '../validators/approval';

const router = Router();

// Protect all routes with auth
router.use(authenticate as any);

// GET /api/approvals - List approvals
router.get('/', getApprovals);

// GET /api/approvals/:id - Get details
router.get('/:id', getApprovalById);

// POST /api/approvals - Request manager approval (Officers / Admins only)
router.post('/', authorize('Officer', 'Admin') as any, validate(createApprovalSchema) as any, submitApprovalRequest);

// PUT /api/approvals/:id/review - Manager decisions (Approved or Rejected)
router.put('/:id/review', authorize('Manager', 'Admin') as any, validate(reviewApprovalSchema) as any, reviewApprovalRequest);

export default router;
