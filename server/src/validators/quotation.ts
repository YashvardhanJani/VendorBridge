import { z } from 'zod';
import { QUOTATION_STATUSES } from '../utils/constants';

export const createQuotationSchema = z.object({
  rfqId: z.string().uuid('Invalid RFQ ID format'),
  deliveryDays: z.number().int().positive('Delivery days must be a positive integer'),
  notes: z.string().optional(),
  status: z.enum(QUOTATION_STATUSES).optional(),
  lineItems: z
    .array(
      z.object({
        itemName: z.string().min(1, 'Item name is required'),
        qty: z.number().positive('Quantity must be greater than zero'),
        unitPrice: z.number().positive('Unit price must be greater than zero'),
      })
    )
    .min(1, 'Quotation must contain at least one line item'),
});

export const updateQuotationSchema = z.object({
  deliveryDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
  status: z.enum(QUOTATION_STATUSES).optional(),
  lineItems: z
    .array(
      z.object({
        itemName: z.string().min(1),
        qty: z.number().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1)
    .optional(),
});
