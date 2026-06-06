# VendorBridge — API Contract (FROZEN)

> **Document Status**: Frozen - Do not modify endpoints without careful consideration  
> **Last Updated**: June 2026

**WARNING**: Do not modify endpoints, request shapes, or response shapes without updating this document first.

**Base URL**: `http://localhost:5000/api`

All authenticated endpoints require header: `Authorization: Bearer <token>`

---

## 1. Authentication

### POST `/api/auth/signup`
**Auth**: Public

**Request**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "Officer | Vendor | Manager | Admin"
}
```

**Response** `201`:
```json
{
  "success": true,
  "token": "jwt_string",
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string",
    "createdAt": "ISO8601"
  }
}
```

**Errors**: `400` validation, `409` email exists

---

### POST `/api/auth/login`
**Auth**: Public

**Request**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response** `200`:
```json
{
  "success": true,
  "token": "jwt_string",
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string",
    "createdAt": "ISO8601"
  }
}
```

**Errors**: `400` validation, `401` invalid credentials

---

### GET `/api/auth/me`
**Auth**: All roles

**Response** `200`:
```json
{
  "success": true,
  "user": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string",
    "createdAt": "ISO8601"
  }
}
```

**Errors**: `401` token invalid/expired

---

## 2. Vendors

### GET `/api/vendors`
**Auth**: Officer, Manager, Admin

**Query Params**: `?search=string&category=string&status=Active|Inactive|Blacklisted&page=1&limit=20`

**Response** `200`:
```json
{
  "success": true,
  "vendors": [
    {
      "id": "number",
      "userId": "number",
      "companyName": "string",
      "gst": "string",
      "category": "string",
      "contactEmail": "string",
      "phone": "string",
      "address": "string",
      "status": "Active | Inactive | Blacklisted",
      "rating": 0.0,
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### GET `/api/vendors/:id`
**Auth**: Officer, Manager, Admin, Vendor (own profile only)

**Response** `200`:
```json
{
  "success": true,
  "vendor": { /* full vendor object */ }
}
```

**Errors**: `404` not found, `403` forbidden

---

### POST `/api/vendors`
**Auth**: Officer, Admin

**Request**:
```json
{
  "companyName": "string",
  "gst": "string",
  "category": "IT | Logistics | Raw Materials | Services | Equipment | Other",
  "contactEmail": "string",
  "phone": "string",
  "address": "string",
  "userId": "number (optional)"
}
```

**Response** `201`:
```json
{
  "success": true,
  "vendor": { /* full vendor object */ }
}
```

**Errors**: `400` validation, `409` GST duplicate

---

### PUT `/api/vendors/:id`
**Auth**: Officer, Admin

**Request**: Same as POST (partial updates allowed)

**Response** `200`:
```json
{
  "success": true,
  "vendor": { /* updated vendor object */ }
}
```

---

### DELETE `/api/vendors/:id`
**Auth**: Admin

**Response** `200`:
```json
{
  "success": true,
  "message": "Vendor deleted successfully"
}
```

---

## 3. RFQs

### GET `/api/rfqs`
**Auth**: All roles (Vendor sees only assigned RFQs)

**Query Params**: `?status=string&search=string&page=1&limit=20`

**Response** `200`:
```json
{
  "success": true,
  "rfqs": [
    {
      "id": "number",
      "refNumber": "VB-RFQ-2026-001",
      "title": "string",
      "description": "string",
      "deadline": "ISO8601",
      "status": "Draft | Published | Awaiting Quotes | Quotes Received | Under Review | Approved | Rejected | PO Generated | Closed",
      "createdBy": "number",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

---

### GET `/api/rfqs/:id`
**Auth**: All roles (Vendor sees only if assigned)

**Response** `200`:
```json
{
  "success": true,
  "rfq": { /* full RFQ with items and quotations */ }
}
```

---

### POST `/api/rfqs`
**Auth**: Officer, Admin

**Request**:
```json
{
  "title": "string",
  "description": "string",
  "deadline": "ISO8601",
  "items": [
    { "name": "string", "qty": "number", "unit": "string" }
  ],
  "assignedVendorIds": ["number"]
}
```

**Response** `201`:
```json
{
  "success": true,
  "rfq": { /* full RFQ object with auto-generated refNumber, status: Draft */ }
}
```

---

### PUT `/api/rfqs/:id`
**Auth**: Officer, Admin (only if status is Draft)

**Request**: Same as POST (partial updates)

**Response** `200`:
```json
{
  "success": true,
  "rfq": { /* updated RFQ */ }
}
```

---

### PUT `/api/rfqs/:id/publish`
**Auth**: Officer, Admin

**Response** `200`:
```json
{
  "success": true,
  "rfq": { /* status changed to Published */ },
  "emailsSent": 3
}
```

Side effects: Sends emails, logs activity, creates notifications

---

### DELETE `/api/rfqs/:id`
**Auth**: Admin (only if Draft)

**Response** `200`:
```json
{
  "success": true,
  "message": "RFQ deleted successfully"
}
```

---

## 4. Quotations

### GET `/api/quotations`
**Auth**: All (Vendor sees own only)

**Query Params**: `?rfqId=number&vendorId=number&status=string&page=1&limit=20`

**Response** `200`:
```json
{
  "success": true,
  "quotations": [
    {
      "id": "number",
      "rfqId": "number",
      "vendorId": "number",
      "totalAmount": "number",
      "deliveryDays": "number",
      "status": "Draft | Submitted | Selected",
      "submittedAt": "ISO8601",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

---

### POST `/api/quotations`
**Auth**: Vendor

**Request**:
```json
{
  "rfqId": "number",
  "items": [
    { "rfqItemId": "number", "unitPrice": "number" }
  ],
  "deliveryDays": "number",
  "notes": "string"
}
```

**Response** `201`:
```json
{
  "success": true,
  "quotation": { /* full quotation, status: Submitted */ }
}
```

---

### GET `/api/quotations/compare/:rfqId`
**Auth**: Officer, Manager, Admin

**Response** `200`:
```json
{
  "success": true,
  "comparison": [
    {
      "vendorId": "number",
      "vendorName": "string",
      "totalAmount": "number",
      "deliveryDays": "number",
      "rating": "number"
    }
  ]
}
```

---

## 5. Approvals

### GET `/api/approvals`
**Auth**: Manager, Admin

**Query Params**: `?status=Pending|Under Review|Approved|Rejected&page=1&limit=20`

**Response** `200`:
```json
{
  "success": true,
  "approvals": [
    {
      "id": "number",
      "rfqId": "number",
      "quotationId": "number",
      "status": "Pending | Under Review | Approved | Rejected",
      "requestedBy": "number",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

### GET `/api/approvals/:id`
**Auth**: Manager, Admin

**Response** `200`:
```json
{
  "success": true,
  "approval": { /* full approval with details */ }
}
```

---

### PUT `/api/approvals/:id/approve`
**Auth**: Manager, Admin

**Request**:
```json
{
  "remarks": "string"
}
```

**Response** `200`:
```json
{
  "success": true,
  "approval": { /* status: Approved */ },
  "purchaseOrder": { /* auto-generated PO */ }
}
```

---

### PUT `/api/approvals/:id/reject`
**Auth**: Manager, Admin

**Request**:
```json
{
  "remarks": "string (required)"
}
```

**Response** `200`:
```json
{
  "success": true,
  "approval": { /* status: Rejected */ }
}
```

---

## 6. Purchase Orders

### GET `/api/purchase-orders`
**Auth**: All roles

**Query Params**: `?status=string&vendorId=number&page=1&limit=20`

**Response** `200`:
```json
{
  "success": true,
  "purchaseOrders": [
    {
      "id": "number",
      "poNumber": "VB-PO-2026-001",
      "vendorId": "number",
      "rfqId": "number",
      "totalAmount": "number",
      "status": "Open | Received | Invoiced | Paid | Closed",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

### GET `/api/purchase-orders/:id`
**Auth**: All roles

**Response** `200`:
```json
{
  "success": true,
  "purchaseOrder": { /* full PO details */ }
}
```

---

### PUT `/api/purchase-orders/:id/mark-delivered`
**Auth**: Vendor, Officer

**Response** `200`:
```json
{
  "success": true,
  "purchaseOrder": { /* status: Received */ }
}
```

---

### PUT `/api/purchase-orders/:id/close`
**Auth**: Officer, Admin

**Response** `200`:
```json
{
  "success": true,
  "purchaseOrder": { /* status: Closed */ }
}
```

---

## 7. Invoices

### GET `/api/invoices`
**Auth**: All roles

**Query Params**: `?status=string&vendorId=number&page=1&limit=20`

**Response** `200`:
```json
{
  "success": true,
  "invoices": [
    {
      "id": "number",
      "invoiceNumber": "VB-INV-2026-001",
      "poId": "number",
      "vendorId": "number",
      "amount": "number",
      "status": "Draft | Sent | Received | Paid",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

### POST `/api/invoices`
**Auth**: Vendor

**Request**:
```json
{
  "poId": "number",
  "invoiceDate": "ISO8601",
  "notes": "string"
}
```

**Response** `201`:
```json
{
  "success": true,
  "invoice": { /* full invoice */ }
}
```

---

### PUT `/api/invoices/:id/submit`
**Auth**: Vendor

**Response** `200`:
```json
{
  "success": true,
  "invoice": { /* status: Sent */ }
}
```

---

### PUT `/api/invoices/:id/mark-paid`
**Auth**: Officer, Admin

**Response** `200`:
```json
{
  "success": true,
  "invoice": { /* status: Paid */ }
}
```

---

## 8. Activity Logs

### GET `/api/activity-logs`
**Auth**: Officer, Manager, Admin

**Query Params**: `?entityType=string&entityId=number&action=string&search=string&page=1&limit=50`

**Response** `200`:
```json
{
  "success": true,
  "logs": [
    {
      "id": "number",
      "entityType": "RFQ | Quotation | Approval | PurchaseOrder | Invoice",
      "entityId": "number",
      "action": "Created | Updated | StatusChanged | Approved | Rejected",
      "userId": "number",
      "userName": "string",
      "description": "string",
      "timestamp": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 0, "totalPages": 0 }
}
```

---

### GET `/api/activity-logs/export/csv`
**Auth**: Officer, Manager, Admin

**Response**: CSV file download

---

## 9. Dashboard

### GET `/api/dashboard/metrics`
**Auth**: Officer, Manager, Admin

**Response** `200`:
```json
{
  "success": true,
  "metrics": {
    "totalSpend": "number",
    "activeVendors": "number",
    "openRFQs": "number",
    "pendingApprovals": "number",
    "outstandingInvoices": "number",
    "completedTransactions": "number"
  }
}
```

---

### GET `/api/dashboard/spend-trends`
**Auth**: Officer, Manager, Admin

**Query Params**: `?period=30|60|90|365`

**Response** `200`:
```json
{
  "success": true,
  "trends": [
    {
      "date": "ISO8601",
      "amount": "number"
    }
  ]
}
```

---

### GET `/api/dashboard/category-breakdown`
**Auth**: Officer, Manager, Admin

**Response** `200`:
```json
{
  "success": true,
  "categories": [
    {
      "category": "string",
      "amount": "number",
      "percentage": "number"
    }
  ]
}
```

---

## Standard Response Format

### Success Response (2xx)
```json
{
  "success": true,
  "data": { /* response body */ },
  "message": "Operation successful"
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate unique field) |
| `500` | Server Error |

---

## Authentication

### JWT Token Structure
```
Header: Authorization: Bearer <jwt_token>
```

Token contains:
- `userId`: User ID
- `email`: User email
- `role`: User role
- `iat`: Issued at
- `exp`: Expires at (7 days by default)

---

## Pagination

All list endpoints support pagination:

**Query Params**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

<div align="center">

**[← Back to Documentation Index](./README.md)**

</div>
