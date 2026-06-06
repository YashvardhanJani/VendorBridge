// ============================================================
// VendorBridge — FROZEN CONSTANTS
// Source of truth: STATUS_FLOW.md & DATABASE_SCHEMA.md
// DO NOT modify without updating the reference documents first.
// ============================================================

// --- User Roles ---
export const USER_ROLES = ['Officer', 'Vendor', 'Manager', 'Admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// --- Vendor ---
export const VENDOR_STATUSES = ['Active', 'Inactive', 'Blacklisted'] as const;
export type VendorStatus = typeof VENDOR_STATUSES[number];

export const VENDOR_CATEGORIES = ['IT', 'Logistics', 'Raw Materials', 'Services', 'Equipment', 'Other'] as const;
export type VendorCategory = typeof VENDOR_CATEGORIES[number];

export const VENDOR_DOC_TYPES = ['PAN', 'GST Certificate', 'Bank Details', 'Other'] as const;
export type VendorDocType = typeof VENDOR_DOC_TYPES[number];

// --- RFQ ---
export const RFQ_STATUSES = [
  'Draft', 'Published', 'Awaiting Quotes', 'Quotes Received',
  'Under Review', 'Approved', 'Rejected', 'PO Generated', 'Closed',
] as const;
export type RFQStatus = typeof RFQ_STATUSES[number];

export const RFQ_TRANSITIONS: Record<RFQStatus, readonly RFQStatus[]> = {
  'Draft':            ['Published'],
  'Published':        ['Awaiting Quotes'],
  'Awaiting Quotes':  ['Quotes Received'],
  'Quotes Received':  ['Under Review'],
  'Under Review':     ['Approved', 'Rejected'],
  'Approved':         ['PO Generated'],
  'Rejected':         ['Draft'],
  'PO Generated':     ['Closed'],
  'Closed':           [],
};

// --- Quotation ---
export const QUOTATION_STATUSES = ['Draft', 'Submitted', 'Withdrawn', 'Selected', 'Rejected'] as const;
export type QuotationStatus = typeof QUOTATION_STATUSES[number];

export const QUOTATION_TRANSITIONS: Record<QuotationStatus, readonly QuotationStatus[]> = {
  'Draft':     ['Submitted'],
  'Submitted': ['Withdrawn', 'Selected', 'Rejected'],
  'Withdrawn': ['Submitted'],
  'Selected':  [],
  'Rejected':  [],
};

// --- Approval ---
export const APPROVAL_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export const APPROVAL_TRANSITIONS: Record<ApprovalStatus, readonly ApprovalStatus[]> = {
  'Pending':       ['Under Review', 'Approved', 'Rejected'],
  'Under Review':  ['Approved', 'Rejected'],
  'Approved':      [],
  'Rejected':      [],
};

// --- Purchase Order ---
export const PO_STATUSES = ['Issued', 'Received', 'Closed'] as const;
export type POStatus = typeof PO_STATUSES[number];

export const PO_TRANSITIONS: Record<POStatus, readonly POStatus[]> = {
  'Issued':   ['Received'],
  'Received': ['Closed'],
  'Closed':   [],
};

// --- Invoice ---
export const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  'Draft':   ['Sent'],
  'Sent':    ['Paid', 'Overdue'],
  'Overdue': ['Paid'],
  'Paid':    [],
};

// --- Activity Log ---
export const ACTIVITY_ENTITY_TYPES = ['RFQ', 'Quotation', 'Approval', 'PO', 'Invoice', 'Vendor'] as const;
export type ActivityEntityType = typeof ACTIVITY_ENTITY_TYPES[number];

// --- Notification ---
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

// --- GST Rates ---
export const GST_RATES = {
  CGST: 9,
  SGST: 9,
  IGST: 18,
} as const;

// --- Reference Number Prefixes ---
export const REF_PREFIXES = {
  RFQ: 'VB-RFQ',
  PO: 'VB-PO',
  INVOICE: 'VB-INV',
} as const;
