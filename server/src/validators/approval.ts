import { z } from 'zod';
import { APPROVAL_STATUSES } from '../utils/constants';

export const createApprovalSchema = z.object({
  quotationId: z.string().uuid('Invalid Quotation ID format'),
});

export const reviewApprovalSchema = z.object({
  status: z.enum(['Under Review', 'Approved', 'Rejected']),
  remarks: z.string().min(1, 'Remarks are required for this action'),
});
