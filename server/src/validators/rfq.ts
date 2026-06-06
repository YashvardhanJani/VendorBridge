import { z } from 'zod';
import { RFQ_STATUSES } from '../utils/constants';

export const createRfqSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional(),
  deadline: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d > new Date();
  }, 'Deadline must be a future date'),
  status: z.enum(RFQ_STATUSES).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, 'Item name is required'),
        description: z.string().optional(),
        qty: z.number().positive('Quantity must be greater than zero'),
        unit: z.string().min(1, 'Unit is required'),
        specNotes: z.string().optional(),
      })
    )
    .min(1, 'RFQ must contain at least one item'),
  assignedVendors: z.array(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1, 'Attachment title is required'),
        url: z.string().url('Invalid attachment URL'),
      })
    )
    .optional(),
});

export const updateRfqSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  deadline: z
    .string()
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d > new Date();
    }, 'Deadline must be a future date')
    .optional(),
  status: z.enum(RFQ_STATUSES).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        qty: z.number().positive(),
        unit: z.string().min(1),
        specNotes: z.string().optional(),
      })
    )
    .min(1)
    .optional(),
  assignedVendors: z.array(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
      })
    )
    .optional(),
});
