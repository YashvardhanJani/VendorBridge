# VendorBridge — System Architecture

> **Document Status**: Frozen for reference  
> **Last Updated**: June 2026

---

## 📐 Architecture Overview

VendorBridge follows a **three-tier monorepo architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Client)                         │
│              React 19 + TypeScript + Vite                    │
│          (src/pages, src/components, src/services)          │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API + JWT Auth
                          │ (http://localhost:5000/api)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Server)                           │
│           Express.js + TypeScript + MySQL2                   │
│     (src/controllers, src/models, src/routes)               │
└─────────────────────────┬───────────────────────────────────┘
                          │ SQL Queries (Parameterized)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                            │
│      (users, vendors, rfqs, quotations, etc.)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

### Root Level
```
VendorBridge/
├── docs/              # 📚 All documentation (THIS FOLDER)
├── server/            # 🔧 Backend API
├── client/            # 💻 Frontend React app
├── database/          # 📊 SQL schema & seeds
├── README.md          # 👈 Start here
```

### Server Structure (`server/`)

```
server/
├── src/
│   ├── server.ts              # Express app initialization
│   ├── dbSetup.ts             # Database initialization & seeding
│   │
│   ├── config/
│   │   ├── db.ts              # MySQL connection pool
│   │   └── logger.ts          # Winston logging setup
│   │
│   ├── models/
│   │   ├── User.ts            # Users table model
│   │   ├── Vendor.ts          # Vendors table model
│   │   ├── RFQ.ts             # RFQs table model
│   │   ├── Quotation.ts       # Quotations table model
│   │   ├── Approval.ts        # Approvals table model
│   │   ├── PurchaseOrder.ts   # Purchase Orders table model
│   │   ├── Invoice.ts         # Invoices table model
│   │   ├── ActivityLog.ts     # Activity logs table model
│   │   └── index.ts           # Model exports
│   │
│   ├── controllers/
│   │   ├── authController.ts        # Login, signup, JWT validation
│   │   ├── vendorController.ts      # Vendor CRUD operations
│   │   ├── rfqController.ts         # RFQ management
│   │   ├── quotationController.ts   # Quotation handling
│   │   ├── approvalController.ts    # Approval workflow
│   │   ├── purchaseOrderController.ts # PO operations
│   │   ├── invoiceController.ts     # Invoice management
│   │   ├── activityLogController.ts # Audit logging
│   │   ├── dashboardController.ts   # Analytics & metrics
│   │   ├── reportsController.ts     # Report generation
│   │   └── notificationController.ts # Notifications
│   │
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── vendorRoutes.ts
│   │   ├── rfqRoutes.ts
│   │   ├── quotationRoutes.ts
│   │   ├── approvalRoutes.ts
│   │   ├── purchaseOrderRoutes.ts
│   │   ├── invoiceRoutes.ts
│   │   ├── activityLogRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── reportsRoutes.ts
│   │   └── notificationRoutes.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification, role checking
│   │   └── validate.ts        # Zod schema validation
│   │
│   ├── validators/
│   │   ├── auth.ts            # Auth schemas (signup, login)
│   │   ├── vendor.ts          # Vendor schemas
│   │   ├── rfq.ts             # RFQ schemas
│   │   ├── quotation.ts       # Quotation schemas
│   │   ├── approval.ts        # Approval schemas
│   │   ├── purchaseOrder.ts   # PO schemas
│   │   └── invoice.ts         # Invoice schemas
│   │
│   └── utils/
│       ├── constants.ts       # Status enums, roles, categories
│       └── refGenerator.ts    # Sequential ID generation (VB-RFQ-2026-001)
│
├── logs/              # 📄 Runtime logs (Winston)
├── dist/              # 📦 Compiled JavaScript (after npm run build)
├── package.json
├── tsconfig.json
└── .env               # Environment variables (git-ignored)
```

**Key Responsibilities:**

| File/Folder | Purpose |
|------------|---------|
| `models/` | Database table definitions and relationships |
| `controllers/` | Business logic and API response handling |
| `routes/` | Express route definitions and method handlers |
| `middleware/` | Cross-cutting concerns (auth, validation) |
| `validators/` | Zod schemas for request validation |
| `utils/` | Helper functions and constants |
| `config/` | Configuration and service initialization |

### Client Structure (`client/`)

```
client/
├── src/
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Root component & routing
│   ├── App.css             # Global styles
│   ├── index.css           # Base styles & TailwindCSS
│   │
│   ├── pages/
│   │   ├── NotFound.tsx    # 404 page
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.tsx    # Login form
│   │   │   └── Signup.tsx   # Signup form
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardHome.tsx   # Main dashboard with analytics
│   │   │
│   │   ├── rfqs/
│   │   │   ├── RFQList.tsx         # List all RFQs
│   │   │   ├── RFQDetail.tsx       # View single RFQ
│   │   │   └── CreateRFQ.tsx       # Create/edit RFQ
│   │   │
│   │   ├── quotations/
│   │   │   ├── QuotationList.tsx   # All quotations
│   │   │   └── QuotationDetail.tsx # View quotation
│   │   │
│   │   ├── approvals/
│   │   │   ├── ApprovalList.tsx    # Pending approvals
│   │   │   ├── ApprovalDetail.tsx  # Approval review
│   │   │   └── ApprovalRequestForm.tsx
│   │   │
│   │   ├── purchase-orders/
│   │   │   ├── PurchaseOrderList.tsx
│   │   │   └── PurchaseOrderDetail.tsx
│   │   │
│   │   ├── invoices/
│   │   │   ├── InvoiceList.tsx
│   │   │   └── InvoiceDetail.tsx
│   │   │
│   │   ├── vendors/
│   │   │   ├── VendorList.tsx
│   │   │   └── VendorDetail.tsx
│   │   │
│   │   ├── logs/
│   │   │   └── ActivityList.tsx
│   │   │
│   │   ├── notifications/
│   │   │   └── NotificationList.tsx
│   │   │
│   │   ├── reports/       # Analytics & reports
│   │   └── rfq/           # RFQ details
│   │
│   ├── components/
│   │   ├── ProtectedRoute.tsx      # Auth guard wrapper
│   │   │
│   │   ├── layout/
│   │   │   ├── Layout.tsx          # Main layout wrapper
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   └── Topbar.tsx          # Header with user menu
│   │   │
│   │   ├── shared/                 # Reusable across app
│   │   │   ├── Modal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── Form.tsx
│   │   │   └── ...
│   │   │
│   │   └── ui/                     # UI building blocks
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── ...
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth context hook
│   │   ├── useRFQ.ts               # RFQ data hook
│   │   ├── usePagination.ts        # Pagination logic
│   │   └── ...
│   │
│   ├── services/
│   │   └── api.ts                  # Axios instance & API calls
│   │
│   ├── store/
│   │   ├── authStore.ts            # Zustand auth state
│   │   ├── notificationStore.ts    # Zustand notification state
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── constants.ts            # App-wide constants
│   │   └── helpers.ts              # Utility functions
│   │
│   └── assets/                     # Images, icons, etc.
│
├── public/                         # Static files
├── dist/                          # Production build (after npm run build)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Key Responsibilities:**

| Folder | Purpose |
|--------|---------|
| `pages/` | Route-level components matching URL paths |
| `components/` | Reusable UI components (layout, shared, ui) |
| `services/` | API client and HTTP communication |
| `store/` | Global state management (Zustand) |
| `hooks/` | Custom React hooks for logic reuse |
| `utils/` | Helper functions and constants |

### Database Structure (`database/`)

```
database/
├── schema.sql      # CREATE TABLE statements
└── seed.sql        # INSERT initial data
```

**Tables:**
- `users` - User accounts and authentication
- `vendors` - Vendor profiles and details
- `rfqs` - Request for Quotation documents
- `rfq_items` - Line items in an RFQ
- `quotations` - Vendor bids on RFQs
- `quotation_items` - Line items in a quotation
- `approvals` - Approval workflow tracking
- `purchase_orders` - Generated from approved quotations
- `invoices` - Vendor billing documents
- `activity_logs` - Audit trail of all actions

---

## 🔄 Data Flow

### 1. User Authentication
```
User Input (Login/Signup)
    ↓
Client Form
    ↓
POST /api/auth/login | /api/auth/signup
    ↓
authController validates & hashes password
    ↓
User model inserts/queries database
    ↓
JWT token generated & returned
    ↓
Zustand authStore updates local state
    ↓
ProtectedRoute allows/blocks access
```

### 2. RFQ Creation & Publishing
```
Officer submits RFQ form (client/pages/rfqs/CreateRFQ.tsx)
    ↓
api.ts sends POST /api/rfqs
    ↓
rfqController creates RFQ with status "Draft"
    ↓
RFQ model inserts into database
    ↓
Activity log created (for audit)
    ↓
Response returned to client
    ↓
User navigated to RFQList with success toast
    ↓
Officer clicks "Publish"
    ↓
rfqController updates RFQ status → "Published"
    ↓
Vendor notification created
    ↓
Emails sent to assigned vendors (EmailJS)
    ↓
RFQ status transitions to "Awaiting Quotes"
```

### 3. Quotation Workflow
```
Vendor receives notification
    ↓
Vendor views RFQ and clicks "Submit Bid"
    ↓
QuotationForm captures rates for each item
    ↓
POST /api/quotations
    ↓
quotationController validates items & pricing
    ↓
Quotation model saves to database
    ↓
RFQ status auto-updates → "Quotes Received"
    ↓
Activity log created
    ↓
Officer receives notification
```

### 4. Approval Workflow
```
Officer compares quotations (bid comparison matrix)
    ↓
Officer selects winning vendor & clicks "Submit for Approval"
    ↓
PUT /api/rfqs/:id (status → "Under Review")
    ↓
Approval record created (status "Pending")
    ↓
Manager receives notification
    ↓
Manager reviews & clicks "Approve"
    ↓
PUT /api/approvals/:id (status → "Approved")
    ↓
rfqController auto-generates Purchase Order
    ↓
PO model inserts with sequential ID (VB-PO-2026-001)
    ↓
RFQ status → "Approved" → "PO Generated"
    ↓
Vendor notified of PO
    ↓
Officer notified of approval completion
```

---

## 🔐 Security Architecture

### Authentication Layer
- **JWT Token**: Signed with `JWT_SECRET` in `.env`
- **Middleware**: `auth.ts` validates token on protected routes
- **Expiry**: 7 days default (configurable)
- **Storage**: Browser localStorage (client-side)

### Validation Layer
- **Zod Schemas**: All input validated before database operations
- **Parameterized Queries**: Prevents SQL injection via MySQL2
- **Role Checking**: Middleware verifies user role for endpoints
- **CORS**: Configured for allowed origins

### Encryption
- **Passwords**: bcryptjs with 10 salt rounds
- **JWT**: HS256 algorithm (symmetric)
- **HTTPS**: Enforced in production (Nginx/reverse proxy)

### Audit Trail
- **ActivityLog**: Every action logged with user, timestamp, entity, action type
- **Immutable**: Logs cannot be modified/deleted
- **Searchable**: Full-text search on logs

---

## 📊 Request/Response Pattern

### Standard API Response Format

**Success (2xx)**:
```json
{
  "success": true,
  "data": { /* response body */ },
  "message": "Operation successful"
}
```

**Error (4xx, 5xx)**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Example: Create RFQ

**Request**:
```typescript
// client/services/api.ts
const response = await axios.post('/rfqs', {
  title: 'Laptop Procurement',
  description: 'Required for Q2 expansion',
  deadline: '2026-06-30',
  items: [
    { itemName: 'Laptops', quantity: 10, estimatedBudget: 50000 }
  ],
  vendorIds: [1, 2, 3]
});
```

**Controller Processing**:
```typescript
// server/src/controllers/rfqController.ts
export const createRFQ = async (req: Request, res: Response) => {
  // 1. Validate request (middleware/validate.ts)
  // 2. Parse request body
  // 3. Insert into RFQ table
  // 4. Insert RFQ items
  // 5. Create activity log
  // 6. Return response
};
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "refNumber": "VB-RFQ-2026-001",
    "status": "Draft",
    "createdAt": "2026-06-06T10:00:00Z"
  }
}
```

---

<div align="center">

**[← Back to Documentation Index](./README.md)**

</div>
