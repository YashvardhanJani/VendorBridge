import { z } from 'zod';
import { INVOICE_STATUSES } from '../utils/constants';

export const createInvoiceSchema = z.object({
  poId: z.string().uuid('Invalid PO ID format'),
  bankDetails: z
    .object({
      bankName: z.string().min(1, 'Bank name is required'),
      accountNo: z.string().min(1, 'Account number is required'),
      ifsc: z.string().min(1, 'IFSC code is required'),
      branch: z.string().min(1, 'Branch name is required'),
    })
    .optional(),
  paymentTerms: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUSES),
});
