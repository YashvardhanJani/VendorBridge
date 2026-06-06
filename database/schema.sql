-- ============================================================
-- VendorBridge ERP — MySQL 8.0 Schema
-- Database: vendor
-- Generated from DATABASE_SCHEMA.md (FROZEN)
-- ============================================================

CREATE DATABASE IF NOT EXISTS vendor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vendor;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('Officer','Vendor','Manager','Admin') NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- 2. VENDORS
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id       CHAR(36)     NULL,
  company_name  VARCHAR(200) NOT NULL,
  gst           VARCHAR(15)  NOT NULL,
  category      ENUM('IT','Logistics','Raw Materials','Services','Equipment','Other') NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  address       TEXT         NOT NULL,
  status        ENUM('Active','Inactive','Blacklisted') NOT NULL DEFAULT 'Active',
  rating        DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE INDEX idx_vendors_gst (gst),
  INDEX idx_vendors_category_status (category, status),
  INDEX idx_vendors_user (user_id),
  CONSTRAINT fk_vendors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 2a. VENDOR DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_documents (
  id        CHAR(36)    NOT NULL DEFAULT (UUID()),
  vendor_id CHAR(36)    NOT NULL,
  name      VARCHAR(255) NOT NULL,
  url       TEXT         NOT NULL,
  type      ENUM('PAN','GST Certificate','Bank Details','Other') NOT NULL,
  created_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_vendordocs_vendor (vendor_id),
  CONSTRAINT fk_vendordocs_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. RFQs
-- ============================================================
CREATE TABLE IF NOT EXISTS rfqs (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  ref_number      VARCHAR(20)  NOT NULL,
  title           VARCHAR(300) NOT NULL,
  description     TEXT         NULL,
  deadline        DATETIME     NOT NULL,
  status          ENUM('Draft','Published','Awaiting Quotes','Quotes Received','Under Review','Approved','Rejected','PO Generated','Closed') NOT NULL DEFAULT 'Draft',
  created_by      CHAR(36)     NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE INDEX idx_rfqs_ref (ref_number),
  INDEX idx_rfqs_status (status),
  INDEX idx_rfqs_created_by (created_by),
  CONSTRAINT fk_rfqs_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 3a. RFQ LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_items (
  id         CHAR(36)    NOT NULL DEFAULT (UUID()),
  rfq_id     CHAR(36)    NOT NULL,
  name       VARCHAR(255) NOT NULL,
  description TEXT        NULL,
  qty        INT          NOT NULL DEFAULT 1,
  unit       VARCHAR(50)  NOT NULL,
  spec_notes TEXT         NULL,

  PRIMARY KEY (id),
  INDEX idx_rfqitems_rfq (rfq_id),
  CONSTRAINT fk_rfqitems_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3b. RFQ ASSIGNED VENDORS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_vendors (
  rfq_id    CHAR(36) NOT NULL,
  vendor_id CHAR(36) NOT NULL,

  PRIMARY KEY (rfq_id, vendor_id),
  CONSTRAINT fk_rfqvendors_rfq    FOREIGN KEY (rfq_id)    REFERENCES rfqs(id) ON DELETE CASCADE,
  CONSTRAINT fk_rfqvendors_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3c. RFQ ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_attachments (
  id      CHAR(36)     NOT NULL DEFAULT (UUID()),
  rfq_id  CHAR(36)     NOT NULL,
  name    VARCHAR(255) NOT NULL,
  url     TEXT         NOT NULL,

  PRIMARY KEY (id),
  INDEX idx_rfqattach_rfq (rfq_id),
  CONSTRAINT fk_rfqattach_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3d. RFQ ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS rfq_activity_log (
  id      CHAR(36)     NOT NULL DEFAULT (UUID()),
  rfq_id  CHAR(36)     NOT NULL,
  action  VARCHAR(100) NOT NULL,
  user_id CHAR(36)     NOT NULL,
  note    TEXT         NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_rfqactivity_rfq (rfq_id),
  CONSTRAINT fk_rfqactivity_rfq  FOREIGN KEY (rfq_id)  REFERENCES rfqs(id) ON DELETE CASCADE,
  CONSTRAINT fk_rfqactivity_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. QUOTATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quotations (
  id            CHAR(36)       NOT NULL DEFAULT (UUID()),
  rfq_id        CHAR(36)       NOT NULL,
  vendor_id     CHAR(36)       NOT NULL,
  delivery_days INT            NOT NULL DEFAULT 1,
  total_amount  DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  notes         TEXT           NULL,
  status        ENUM('Draft','Submitted','Withdrawn','Selected','Rejected') NOT NULL DEFAULT 'Submitted',
  submitted_at  DATETIME       NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE INDEX idx_quotations_rfq_vendor (rfq_id, vendor_id),
  INDEX idx_quotations_status (status),
  CONSTRAINT fk_quotations_rfq    FOREIGN KEY (rfq_id)    REFERENCES rfqs(id),
  CONSTRAINT fk_quotations_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB;

-- ============================================================
-- 4a. QUOTATION LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS quotation_line_items (
  id           CHAR(36)       NOT NULL DEFAULT (UUID()),
  quotation_id CHAR(36)       NOT NULL,
  item_name    VARCHAR(255)   NOT NULL,
  unit_price   DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  qty          INT            NOT NULL DEFAULT 1,
  total        DECIMAL(15,2)  NOT NULL DEFAULT 0.00,

  PRIMARY KEY (id),
  INDEX idx_qli_quotation (quotation_id),
  CONSTRAINT fk_qli_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5. APPROVALS
-- ============================================================
CREATE TABLE IF NOT EXISTS approvals (
  id            CHAR(36)  NOT NULL DEFAULT (UUID()),
  quotation_id  CHAR(36)  NOT NULL,
  rfq_id        CHAR(36)  NOT NULL,
  requested_by  CHAR(36)  NOT NULL,
  approved_by   CHAR(36)  NULL,
  status        ENUM('Pending','Under Review','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  remarks       TEXT      NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_approvals_rfq (rfq_id),
  INDEX idx_approvals_status (status),
  INDEX idx_approvals_requested (requested_by),
  CONSTRAINT fk_approvals_quotation  FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  CONSTRAINT fk_approvals_rfq        FOREIGN KEY (rfq_id)       REFERENCES rfqs(id),
  CONSTRAINT fk_approvals_requested  FOREIGN KEY (requested_by) REFERENCES users(id),
  CONSTRAINT fk_approvals_approved   FOREIGN KEY (approved_by)  REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 5a. APPROVAL TIMELINE
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_timeline (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  approval_id CHAR(36)     NOT NULL,
  status      VARCHAR(50)  NOT NULL,
  user_id     CHAR(36)     NOT NULL,
  note        TEXT         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_aptimeline_approval (approval_id),
  CONSTRAINT fk_aptimeline_approval FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE CASCADE,
  CONSTRAINT fk_aptimeline_user     FOREIGN KEY (user_id)     REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id               CHAR(36)       NOT NULL DEFAULT (UUID()),
  po_number        VARCHAR(20)    NOT NULL,
  quotation_id     CHAR(36)       NOT NULL,
  rfq_id           CHAR(36)       NOT NULL,
  vendor_id        CHAR(36)       NOT NULL,
  delivery_address TEXT           NULL,
  terms            TEXT           NULL,
  grand_total      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  cgst             DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  sgst             DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  igst             DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  status           ENUM('Issued','Received','Closed') NOT NULL DEFAULT 'Issued',
  created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE INDEX idx_po_number (po_number),
  INDEX idx_po_vendor (vendor_id),
  INDEX idx_po_status (status),
  CONSTRAINT fk_po_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  CONSTRAINT fk_po_rfq       FOREIGN KEY (rfq_id)       REFERENCES rfqs(id),
  CONSTRAINT fk_po_vendor    FOREIGN KEY (vendor_id)     REFERENCES vendors(id)
) ENGINE=InnoDB;

-- ============================================================
-- 6a. PURCHASE ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS po_items (
  id         CHAR(36)       NOT NULL DEFAULT (UUID()),
  po_id      CHAR(36)       NOT NULL,
  name       VARCHAR(255)   NOT NULL,
  qty        INT            NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  gst        DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  total      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,

  PRIMARY KEY (id),
  INDEX idx_poitems_po (po_id),
  CONSTRAINT fk_poitems_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id              CHAR(36)       NOT NULL DEFAULT (UUID()),
  invoice_number  VARCHAR(20)    NOT NULL,
  po_id           CHAR(36)       NOT NULL,
  vendor_id       CHAR(36)       NOT NULL,
  subtotal        DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  cgst            DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  sgst            DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  igst            DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  total_tax       DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  grand_total     DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  bank_name       VARCHAR(200)   NULL,
  account_no      VARCHAR(50)    NULL,
  ifsc            VARCHAR(20)    NULL,
  bank_branch     VARCHAR(200)   NULL,
  payment_terms   TEXT           NULL,
  due_date        DATE           NULL,
  status          ENUM('Draft','Sent','Paid','Overdue') NOT NULL DEFAULT 'Draft',
  sent_at         DATETIME       NULL,
  paid_at         DATETIME       NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE INDEX idx_invoices_number (invoice_number),
  INDEX idx_invoices_po (po_id),
  INDEX idx_invoices_status (status),
  CONSTRAINT fk_invoices_po     FOREIGN KEY (po_id)     REFERENCES purchase_orders(id),
  CONSTRAINT fk_invoices_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB;

-- ============================================================
-- 7a. INVOICE LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id         CHAR(36)       NOT NULL DEFAULT (UUID()),
  invoice_id CHAR(36)       NOT NULL,
  name       VARCHAR(255)   NOT NULL,
  qty        INT            NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  gst        DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  total      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,

  PRIMARY KEY (id),
  INDEX idx_invitems_invoice (invoice_id),
  CONSTRAINT fk_invitems_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 8. ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  entity_type  ENUM('RFQ','Quotation','Approval','PO','Invoice','Vendor') NOT NULL,
  entity_id    CHAR(36)     NOT NULL,
  action       VARCHAR(100) NOT NULL,
  performed_by CHAR(36)     NOT NULL,
  details      TEXT         NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_actlog_entity (entity_type, entity_id),
  INDEX idx_actlog_performed (performed_by),
  INDEX idx_actlog_created (created_at DESC),
  CONSTRAINT fk_actlog_user FOREIGN KEY (performed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id    CHAR(36)     NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT         NOT NULL,
  type       ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  link       VARCHAR(500) NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_created (created_at DESC),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
