import { z } from 'zod';
import { VENDOR_CATEGORIES, VENDOR_STATUSES, VENDOR_DOC_TYPES } from '../utils/constants';

// GSTIN format: 2 numbers, 5 letters, 4 numbers, 1 letter, 1 number/letter, 'Z', 1 number/letter
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const createVendorSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(200),
  gst: z.string().regex(gstRegex, 'Invalid GST number format (e.g. 27AAAAA1111A1Z1)'),
  category: z.enum(VENDOR_CATEGORIES, {
    message: 'Invalid vendor category',
  }),
  contactEmail: z.string().email('Invalid contact email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  status: z.enum(VENDOR_STATUSES).optional(),
  documents: z
    .array(
      z.object({
        name: z.string().min(1, 'Document name is required'),
        url: z.string().url('Invalid document URL'),
        type: z.enum(VENDOR_DOC_TYPES, {
          message: 'Invalid document type',
        }),
      })
    )
    .optional(),
});

export const updateVendorSchema = createVendorSchema.partial();
