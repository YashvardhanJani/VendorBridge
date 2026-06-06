import { z } from 'zod';
import { PO_STATUSES } from '../utils/constants';

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(PO_STATUSES),
});
