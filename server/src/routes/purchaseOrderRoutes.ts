import { Router } from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus
} from '../controllers/purchaseOrderController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updatePurchaseOrderSchema } from '../validators/purchaseOrder';

const router = Router();

// Protect all routes with auth
router.use(authenticate as any);

// GET /api/purchase-orders - List POs
router.get('/', getPurchaseOrders);

// GET /api/purchase-orders/:id - Get details
router.get('/:id', getPurchaseOrderById);

// PUT /api/purchase-orders/:id/status - Update status
router.put('/:id/status', validate(updatePurchaseOrderSchema) as any, updatePurchaseOrderStatus);

export default router;
