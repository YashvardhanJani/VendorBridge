# VendorBridge — Database Schema (FROZEN)

> **Document Status**: Frozen - Do not modify endpoints without careful consideration  
> **Last Updated**: June 2026

**WARNING**: These table definitions are frozen. Do not add, remove, or rename fields without updating this document first.

**Database**: MySQL 8.0+  
**Connection**: `mysql2`

---

## Overview

```sql
-- Run these scripts to setup:
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

---

## 1. Users

Stores user authentication and role information.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| `id` | INT | ✅ | ✅ | PRIMARY KEY, auto-increment |
| `name` | VARCHAR(100) | ✅ | ❌ | Min 2 chars |
| `email` | VARCHAR(255) | ✅ | ✅ | Unique, indexed |
| `passwordHash` | VARCHAR(255) | ✅ | ❌ | bcryptjs hashed |
| `role` | ENUM | ✅ | ❌ | Officer, Vendor, Manager, Admin |
| `createdAt` | TIMESTAMP | auto | ❌ | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | auto | ❌ | DEFAULT NOW() |

**Indexes**: `UNIQUE KEY (email)`, `KEY (role)`

**Sample Data**:
```sql
INSERT INTO users (name, email, passwordHash, role)
VALUES ('Officer User', 'officer@vendorbridge.com', '$2a$10$...', 'Officer');
```

---

## 2. Vendors

Vendor company profiles with GST and contact information.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| `id` | INT | ✅ | ✅ | PRIMARY KEY, auto-increment |
| `userId` | INT | ❌ | ❌ | FOREIGN KEY → users.id |
| `companyName` | VARCHAR(200) | ✅ | ❌ | Min 2 chars |
| `gst` | VARCHAR(15) | ✅ | ✅ | 15-char GST, indexed |
| `category` | ENUM | ✅ | ❌ | IT, Logistics, Raw Materials, Services, Equipment, Other |
| `contactEmail` | VARCHAR(255) | ✅ | ❌ | Vendor contact email |
| `phone` | VARCHAR(20) | ✅ | ❌ | 10-digit phone |
| `address` | TEXT | ✅ | ❌ | Full address |
| `status` | ENUM | ✅ | ❌ | Active, Inactive, Blacklisted (default: Active) |
| `rating` | DECIMAL(3,2) | ❌ | ❌ | 0.0 to 5.0, default: 0 |
| `createdAt` | TIMESTAMP | auto | ❌ | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | auto | ❌ | DEFAULT NOW() |

**Indexes**: `UNIQUE KEY (gst)`, `KEY (category, status)`, `FOREIGN KEY (userId)`

---

## 3. RFQs

Request for Quotation master document.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| `id` | INT | ✅ | ✅ | PRIMARY KEY, auto-increment |
| `refNumber` | VARCHAR(50) | ✅ | ✅ | Format: VB-RFQ-YYYY-NNN |
| `title` | VARCHAR(300) | ✅ | ❌ | Min 5 chars |
| `description` | TEXT | ❌ | ❌ | Detailed requirements |
| `deadline` | DATETIME | ✅ | ❌ | Must be future date |
| `status` | ENUM | ✅ | ❌ | Draft, Published, Awaiting Quotes, ... (see STATUS_FLOWS.md) |
| `createdBy` | INT | ✅ | ❌ | FOREIGN KEY → users.id |
| `createdAt` | TIMESTAMP | auto | ❌ | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | auto | ❌ | DEFAULT NOW() |

**Indexes**: `UNIQUE KEY (refNumber)`, `KEY (status)`, `KEY (createdBy)`, `FOREIGN KEY (createdBy)`

---

## 4. RFQ_Items

Line items within an RFQ.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `rfqId` | INT | ✅ | FOREIGN KEY → rfqs.id |
| `name` | VARCHAR(300) | ✅ | Item description |
| `quantity` | DECIMAL(10,2) | ✅ | Ordered quantity |
| `unit` | VARCHAR(50) | ✅ | Unit of measurement (e.g., "Pieces", "Meters") |
| `specNotes` | TEXT | ❌ | Technical specifications |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `FOREIGN KEY (rfqId)`, `KEY (rfqId)`

---

## 5. RFQ_Vendors

Junction table for many-to-many relationship between RFQs and Vendors.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `rfqId` | INT | ✅ | FOREIGN KEY → rfqs.id |
| `vendorId` | INT | ✅ | FOREIGN KEY → vendors.id |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `FOREIGN KEY (rfqId)`, `FOREIGN KEY (vendorId)`, `UNIQUE KEY (rfqId, vendorId)`

---

## 6. Quotations

Vendor bids on RFQs.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `rfqId` | INT | ✅ | FOREIGN KEY → rfqs.id |
| `vendorId` | INT | ✅ | FOREIGN KEY → vendors.id |
| `totalAmount` | DECIMAL(15,2) | ✅ | Sum of all line items |
| `deliveryDays` | INT | ✅ | Delivery timeframe |
| `notes` | TEXT | ❌ | Vendor comments |
| `status` | ENUM | ✅ | Draft, Submitted, Selected |
| `submittedAt` | DATETIME | ❌ | When quotation was finalized |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `FOREIGN KEY (rfqId)`, `FOREIGN KEY (vendorId)`, `KEY (status)`, `KEY (rfqId, vendorId)`

---

## 7. Quotation_Items

Line items within a quotation.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `quotationId` | INT | ✅ | FOREIGN KEY → quotations.id |
| `rfqItemId` | INT | ✅ | FOREIGN KEY → rfq_items.id |
| `unitPrice` | DECIMAL(15,2) | ✅ | Price per unit |
| `quantity` | DECIMAL(10,2) | ✅ | Quoted quantity |
| `total` | DECIMAL(15,2) | ✅ | unitPrice × quantity |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `FOREIGN KEY (quotationId)`, `FOREIGN KEY (rfqItemId)`

---

## 8. Approvals

Multi-level approval workflow tracking.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `rfqId` | INT | ✅ | FOREIGN KEY → rfqs.id |
| `quotationId` | INT | ✅ | FOREIGN KEY → quotations.id |
| `status` | ENUM | ✅ | Pending, Under Review, Approved, Rejected |
| `requestedBy` | INT | ✅ | FOREIGN KEY → users.id (Officer) |
| `approvedBy` | INT | ❌ | FOREIGN KEY → users.id (Manager/Admin) |
| `remarks` | TEXT | ❌ | Approval or rejection comments |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `FOREIGN KEY (rfqId)`, `FOREIGN KEY (quotationId)`, `KEY (status)`

---

## 9. Purchase_Orders

Auto-generated purchase orders from approved quotations.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `poNumber` | VARCHAR(50) | ✅ | Format: VB-PO-YYYY-NNN (unique) |
| `rfqId` | INT | ✅ | FOREIGN KEY → rfqs.id |
| `quotationId` | INT | ✅ | FOREIGN KEY → quotations.id |
| `vendorId` | INT | ✅ | FOREIGN KEY → vendors.id |
| `totalAmount` | DECIMAL(15,2) | ✅ | Total PO value |
| `status` | ENUM | ✅ | Open, Received, Invoiced, Paid, Closed |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `UNIQUE KEY (poNumber)`, `FOREIGN KEY (vendorId)`, `KEY (status)`

---

## 10. Purchase_Order_Items

Line items in a purchase order.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `poId` | INT | ✅ | FOREIGN KEY → purchase_orders.id |
| `rfqItemId` | INT | ✅ | FOREIGN KEY → rfq_items.id |
| `unitPrice` | DECIMAL(15,2) | ✅ | Agreed price |
| `quantity` | DECIMAL(10,2) | ✅ | Ordered quantity |
| `total` | DECIMAL(15,2) | ✅ | unitPrice × quantity |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `FOREIGN KEY (poId)`

---

## 11. Invoices

Vendor billing documents for payment settlement.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `invoiceNumber` | VARCHAR(50) | ✅ | Format: VB-INV-YYYY-NNN (unique) |
| `poId` | INT | ✅ | FOREIGN KEY → purchase_orders.id |
| `vendorId` | INT | ✅ | FOREIGN KEY → vendors.id |
| `invoiceDate` | DATE | ✅ | Invoice date |
| `amount` | DECIMAL(15,2) | ✅ | Total invoice amount |
| `taxAmount` | DECIMAL(15,2) | ❌ | Tax (CGST+SGST or IGST) |
| `status` | ENUM | ✅ | Draft, Sent, Received, Paid |
| `notes` | TEXT | ❌ | Invoice notes |
| `createdAt` | TIMESTAMP | auto | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `UNIQUE KEY (invoiceNumber)`, `FOREIGN KEY (poId)`, `FOREIGN KEY (vendorId)`, `KEY (status)`

---

## 12. Activity_Logs

Complete audit trail of all actions.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | INT | ✅ | PRIMARY KEY, auto-increment |
| `entityType` | ENUM | ✅ | RFQ, Quotation, Approval, PurchaseOrder, Invoice, Vendor |
| `entityId` | INT | ✅ | ID of the affected entity |
| `action` | ENUM | ✅ | Created, Updated, StatusChanged, Approved, Rejected, Deleted |
| `userId` | INT | ✅ | FOREIGN KEY → users.id |
| `description` | TEXT | ✅ | Human-readable action description |
| `changes` | JSON | ❌ | {oldValue, newValue} for audit |
| `timestamp` | TIMESTAMP | auto | DEFAULT NOW() |

**Indexes**: `KEY (entityType, entityId)`, `KEY (userId)`, `KEY (timestamp)`

**Immutable**: These records cannot be modified or deleted after creation.

---

## Relationships

```
Users (1) ──┬─→ (Many) Vendors
            ├─→ (Many) RFQs (createdBy)
            └─→ (Many) Activity_Logs

Vendors (1) ──→ (Many) Quotations
         (1) ──→ (Many) Purchase_Orders
         (1) ──→ (Many) Invoices

RFQs (1) ──┬─→ (Many) RFQ_Items
        (1) ├─→ (Many) Quotations
        (1) ├─→ (Many) Purchase_Orders
        (1) └─→ (Many) Approvals
        (M) ──→ (M) Vendors (via RFQ_Vendors)

Quotations (1) ──┬─→ (Many) Quotation_Items
             (1) ├─→ (1) Approvals
             (1) └─→ (1) Purchase_Orders

Purchase_Orders (1) ──┬─→ (Many) Purchase_Order_Items
                   (1) ├─→ (Many) Invoices
                   (1) └─→ (Many) Activity_Logs

Invoices (1) ──→ (Many) Activity_Logs
```

---

## Data Types Reference

| Type | Range | Example |
|------|-------|---------|
| `INT` | -2B to +2B | 12345 |
| `DECIMAL(15,2)` | Precise decimals | 9999999999.99 |
| `VARCHAR(n)` | String up to n chars | "TechNova" |
| `TEXT` | Large text | Descriptions, notes |
| `DATE` | YYYY-MM-DD | 2026-06-06 |
| `DATETIME` | YYYY-MM-DD HH:MM:SS | 2026-06-06 10:30:00 |
| `TIMESTAMP` | Auto-managed datetime | Auto on insert/update |
| `ENUM` | Predefined values | 'Active', 'Draft' |
| `JSON` | JSON data | {"key": "value"} |

---

## Migration Notes

### Future Changes
When modifying the schema:
1. Create backup: `mysqldump vendor > backup.sql`
2. Run migration: `ALTER TABLE ...`
3. Test thoroughly
4. Update this document
5. Update seed.sql if needed
6. Commit with detailed message

### Version Control
- `schema.sql`: Source of truth for structure
- `seed.sql`: Initial/test data
- Both are version controlled

---

<div align="center">

**[← Back to Documentation Index](./README.md)**

</div>
