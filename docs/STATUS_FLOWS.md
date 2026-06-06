# VendorBridge — Status Flows (FROZEN)

> **Document Status**: Frozen - Do not modify endpoints without careful consideration  
> **Last Updated**: June 2026

**WARNING**: These status values and transitions are frozen. All status checks in code must use these exact string values.

---

## 1. RFQ Status Flow

### Statuses (Enum Values)

```
Draft
Published
Awaiting Quotes
Quotes Received
Under Review
Approved
Rejected
PO Generated
Closed
```

### Transition Rules

```
Draft ──────────────► Published           (Officer publishes RFQ)
Published ──────────► Awaiting Quotes     (Auto: after email sent to vendors)
Awaiting Quotes ────► Quotes Received     (Auto: when first quotation is submitted)
Quotes Received ────► Under Review        (Officer selects a vendor, triggers approval)
Under Review ───────► Approved            (Manager/Admin approves)
Under Review ───────► Rejected            (Manager/Admin rejects)
Approved ───────────► PO Generated        (Auto: PO is created upon approval)
PO Generated ──────► Closed              (Officer manually closes after delivery)
Rejected ───────────► Draft               (Officer can re-edit and re-publish)
```

### Transition Side Effects

| Transition | Side Effects |
|-----------|-------------|
| Draft → Published | Log activity, create notifications for assigned vendors |
| Published → Awaiting Quotes | Log activity, send emails to assigned vendors |
| Awaiting Quotes → Quotes Received | Log activity |
| Quotes Received → Under Review | Log activity, create Approval record, notify Manager |
| Under Review → Approved | Log activity, notify Officer |
| Under Review → Rejected | Log activity, notify Officer |
| Approved → PO Generated | Log activity, create PurchaseOrder, notify Vendor |
| PO Generated → Closed | Log activity |
| Rejected → Draft | Log activity |

### Valid Transitions Map (for code enforcement)

```typescript
const RFQ_TRANSITIONS: Record<string, string[]> = {
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
```

---

## 2. Approval Status Flow

### Statuses (Enum Values)

```
Pending
Under Review
Approved
Rejected
```

### Transition Rules

```
Pending ────────────► Under Review        (Manager opens the approval)
Under Review ───────► Approved            (Manager/Admin approves with optional remarks)
Under Review ───────► Rejected            (Manager/Admin rejects with REQUIRED remarks)
Pending ────────────► Approved            (Direct approve without review step)
Pending ────────────► Rejected            (Direct reject with REQUIRED remarks)
```

### Transition Side Effects

| Transition | Side Effects |
|-----------|-------------|
| Pending → Under Review | Add timeline entry, log activity |
| Under Review → Approved | Add timeline entry, log activity, update RFQ status → Approved, create PO, email Officer |
| Under Review → Rejected | Add timeline entry, log activity, update RFQ status → Rejected, email Officer |
| Pending → Approved | Create PO directly, update RFQ status → Approved, log activity |
| Pending → Rejected | Update RFQ status → Rejected, log activity |

### Valid Transitions Map

```typescript
const APPROVAL_TRANSITIONS: Record<string, string[]> = {
  'Pending':      ['Under Review', 'Approved', 'Rejected'],
  'Under Review': ['Approved', 'Rejected'],
  'Approved':     [],
  'Rejected':     [],
};
```

---

## 3. Purchase Order Status Flow

### Statuses (Enum Values)

```
Open
Received
Invoiced
Paid
Closed
```

### Transition Rules

```
Open ──────────────► Received     (Vendor marks goods as delivered)
Received ──────────► Invoiced     (Vendor generates invoice)
Invoiced ──────────► Paid         (Officer records payment clearance)
Paid ──────────────► Closed       (Officer closes the PO)
```

### Transition Side Effects

| Transition | Side Effects |
|-----------|-------------|
| Open → Received | Log activity, create GRN (Goods Receipt Note), notify Officer |
| Received → Invoiced | Log activity, generate invoice template |
| Invoiced → Paid | Log activity, update vendor rating, notify Vendor |
| Paid → Closed | Log activity, final reconciliation |

### Valid Transitions Map

```typescript
const PO_TRANSITIONS: Record<string, string[]> = {
  'Open':      ['Received'],
  'Received':  ['Invoiced'],
  'Invoiced':  ['Paid'],
  'Paid':      ['Closed'],
  'Closed':    [],
};
```

---

## 4. Invoice Status Flow

### Statuses (Enum Values)

```
Draft
Sent
Received
Paid
Overdue (optional future status)
Disputed (optional future status)
```

### Transition Rules

```
Draft ──────────────► Sent        (Vendor submits invoice)
Sent ───────────────► Received    (Officer receives and logs invoice)
Received ───────────► Paid        (Officer records payment)
```

### Transition Side Effects

| Transition | Side Effects |
|-----------|-------------|
| Draft → Sent | Log activity, email Officer, PO status → Invoiced |
| Sent → Received | Log activity |
| Received → Paid | Log activity, update PO status → Paid, archive invoice |

### Valid Transitions Map

```typescript
const INVOICE_TRANSITIONS: Record<string, string[]> = {
  'Draft':    ['Sent'],
  'Sent':     ['Received'],
  'Received': ['Paid'],
  'Paid':     [],
};
```

---

## 5. Quotation Status Flow

### Statuses (Enum Values)

```
Draft
Submitted
Selected
Rejected
Withdrawn
```

### Transition Rules

```
Draft ──────────────► Submitted    (Vendor finalizes and submits bid)
Submitted ──────────► Selected     (Officer chooses this quotation)
Submitted ──────────► Rejected     (Officer rejects this bid)
Submitted ──────────► Withdrawn    (Vendor withdraws bid before RFQ deadline)
Selected ───────────► Rejected     (Later changed by Manager's rejection)
```

### Transition Side Effects

| Transition | Side Effects |
|-----------|-------------|
| Draft → Submitted | Log activity, update RFQ status if first submission, notify Officer |
| Submitted → Selected | Log activity, create Approval record, deselect other quotations |
| Submitted → Rejected | Log activity |
| Submitted → Withdrawn | Log activity |
| Selected → Rejected | Log activity, revert RFQ status to Quotes Received |

### Valid Transitions Map

```typescript
const QUOTATION_TRANSITIONS: Record<string, string[]> = {
  'Draft':      ['Submitted'],
  'Submitted':  ['Selected', 'Rejected', 'Withdrawn'],
  'Selected':   ['Rejected'],
  'Rejected':   [],
  'Withdrawn':  [],
};
```

---

## 6. State Machine Validation Rules

### Implementation in Code

All controllers must validate transitions before updating status:

```typescript
// server/src/controllers/rfqController.ts
const isValidTransition = (currentStatus: string, newStatus: string): boolean => {
  const validTransitions = RFQ_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
};

export const updateRFQStatus = async (req, res) => {
  const { newStatus } = req.body;
  const { id } = req.params;
  
  // Validate transition
  if (!isValidTransition(currentStatus, newStatus)) {
    return res.status(400).json({
      success: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
      code: 'INVALID_TRANSITION'
    });
  }
  
  // Process transition (execute side effects)
  // Update database
  // Log activity
};
```

---

## 7. Complete Procurement Lifecycle

```
START
  │
  ▼
[Officer] Create RFQ (Draft)
  │
  ▼
[Officer] Publish RFQ (→ Published → Awaiting Quotes)
  │
  ├─► Email sent to assigned vendors
  │
  ▼
[Vendor] Submit Quotation (→ Quotes Received)
  │
  ├─► [Officer] Receives notification
  │
  ▼
[Officer] Compare quotations & select (→ Under Review)
  │
  ├─► [Manager] Receives approval request
  │
  ▼
[Manager] Review & Approve (→ Approved → PO Generated)
  │
  ├─► Purchase Order auto-created
  ├─► [Vendor] Receives PO notification
  │
  ▼
[Vendor] Mark Delivered (PO: Open → Received)
  │
  ├─► [Officer] Receives GRN notification
  │
  ▼
[Officer] Close PO (PO: Received → ... → Closed)
  │
  ▼
[Vendor] Generate Invoice (Invoice: Draft)
  │
  ▼
[Vendor] Submit Invoice (Invoice: Draft → Sent)
  │
  ├─► [Officer] Receives invoice notification
  │
  ▼
[Officer] Record Payment (Invoice: → Paid)
  │
  ▼
END (RFQ: Closed, PO: Closed, Invoice: Paid)
```

---

## 8. Status Enum Constants

Use these constants in code to prevent typos:

```typescript
// server/src/utils/constants.ts

export const RFQ_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  AWAITING_QUOTES: 'Awaiting Quotes',
  QUOTES_RECEIVED: 'Quotes Received',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PO_GENERATED: 'PO Generated',
  CLOSED: 'Closed',
} as const;

export const APPROVAL_STATUS = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

export const PO_STATUS = {
  OPEN: 'Open',
  RECEIVED: 'Received',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  CLOSED: 'Closed',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  RECEIVED: 'Received',
  PAID: 'Paid',
} as const;

export const QUOTATION_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
} as const;
```

---

## 9. Activity Log Actions

Log entries should record one of these actions:

```typescript
export const ACTIVITY_ACTIONS = {
  CREATED: 'Created',
  UPDATED: 'Updated',
  STATUS_CHANGED: 'StatusChanged',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
  SUBMITTED: 'Submitted',
  DELETED: 'Deleted',
  MARKED_DELIVERED: 'MarkedDelivered',
  PAYMENT_RECORDED: 'PaymentRecorded',
} as const;
```

---

## Testing Status Transitions

Use this checklist to verify all transitions work correctly:

- [ ] RFQ: Draft → Published → Awaiting Quotes → Quotes Received → Under Review → Approved → PO Generated → Closed
- [ ] Approval: Pending → Under Review → Approved (with PO creation)
- [ ] Approval: Pending → Rejected
- [ ] PO: Open → Received → Invoiced → Paid → Closed
- [ ] Invoice: Draft → Sent → Received → Paid
- [ ] Quotation: Draft → Submitted → Selected
- [ ] Quotation: Draft → Submitted → Rejected
- [ ] RFQ Rejection: Under Review → Rejected → Draft (can re-publish)

---

<div align="center">

**[← Back to Documentation Index](./README.md)**

</div>
