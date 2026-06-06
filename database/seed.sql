-- ============================================================
-- VendorBridge ERP — Seed Data for Demo
-- Run AFTER schema.sql
-- ============================================================

USE vendor;

-- Password: password123 (bcrypt hash)
SET @hash = '$2b$10$vcI6VYCZ6T5MGM0Tyelr6e0kyH.pA52yJBb7X5RQPUPcZQpQ89HJa';

-- ============================================================
-- USERS (4 roles)
-- ============================================================
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('u-officer-001', 'Rahul Sharma',   'officer@vendorbridge.com',  @hash, 'Officer'),
  ('u-vendor-001',  'Priya Patel',    'vendor@vendorbridge.com',   @hash, 'Vendor'),
  ('u-vendor-002',  'Amit Desai',     'vendor2@vendorbridge.com',  @hash, 'Vendor'),
  ('u-vendor-003',  'Neha Gupta',     'vendor3@vendorbridge.com',  @hash, 'Vendor'),
  ('u-manager-001', 'Sanjay Kumar',   'manager@vendorbridge.com',  @hash, 'Manager'),
  ('u-admin-001',   'Anita Reddy',    'admin@vendorbridge.com',    @hash, 'Admin');

-- ============================================================
-- VENDORS (linked to vendor users)
-- ============================================================
INSERT INTO vendors (id, user_id, company_name, gst, category, contact_email, phone, address, status, rating) VALUES
  ('v-001', 'u-vendor-001', 'TechNova Solutions Pvt Ltd',    '27AABCT1234F1ZP', 'IT',             'priya@technova.in',     '9876543210', '501, Bandra Kurla Complex, Mumbai, MH 400051',        'Active',      4.50),
  ('v-002', 'u-vendor-002', 'SpeedLine Logistics',           '29AABCS5678G1ZQ', 'Logistics',      'amit@speedline.co.in',  '9876543211', '12, Whitefield Road, Bangalore, KA 560066',            'Active',      3.80),
  ('v-003', 'u-vendor-003', 'GreenRaw Materials Co',         '07AABCG9012H1ZR', 'Raw Materials',  'neha@greenraw.com',     '9876543212', '34, Sector 18, Noida, UP 201301',                      'Active',      4.20),
  ('v-004', NULL,           'ProServe Facilities',           '33AABCP3456I1ZS', 'Services',       'info@proserve.in',      '9876543213', '78, Anna Nagar, Chennai, TN 600040',                   'Active',      3.50),
  ('v-005', NULL,           'HeavyLift Equipment India',     '24AABCH7890J1ZT', 'Equipment',      'sales@heavylift.co.in', '9876543214', '90, MIDC Industrial Area, Pune, MH 411044',            'Inactive',    4.00),
  ('v-006', NULL,           'InfoBridge Consulting',         '06AABCI2345K1ZU', 'IT',             'hello@infobridge.com',  '9876543215', '56, Cyber City, Gurgaon, HR 122002',                   'Active',      4.70),
  ('v-007', NULL,           'QuickShip Express',             '19AABCQ6789L1ZV', 'Logistics',      'ops@quickship.in',      '9876543216', '23, Salt Lake, Kolkata, WB 700091',                    'Active',      3.90),
  ('v-008', NULL,           'SteelCore Industries',          '27AABCS1234M1ZW', 'Raw Materials',  'sales@steelcore.co.in', '9876543217', '45, Andheri East, Mumbai, MH 400069',                  'Blacklisted', 2.10);

-- ============================================================
-- VENDOR DOCUMENTS
-- ============================================================
INSERT INTO vendor_documents (vendor_id, name, url, type) VALUES
  ('v-001', 'GST Certificate',   '/uploads/technova_gst.pdf',   'GST Certificate'),
  ('v-001', 'PAN Card',          '/uploads/technova_pan.pdf',   'PAN'),
  ('v-002', 'GST Certificate',   '/uploads/speedline_gst.pdf',  'GST Certificate'),
  ('v-003', 'Bank Details',      '/uploads/greenraw_bank.pdf',  'Bank Details');

-- ============================================================
-- RFQs
-- ============================================================
INSERT INTO rfqs (id, ref_number, title, description, deadline, status, created_by) VALUES
  ('rfq-001', 'VB-RFQ-2025-001', 'Annual IT Infrastructure Upgrade',
   'Procurement of servers, networking equipment, and licenses for FY 2025-26.',
   '2025-07-15 23:59:59', 'Quotes Received', 'u-officer-001'),

  ('rfq-002', 'VB-RFQ-2025-002', 'Office Furniture Procurement',
   'Ergonomic chairs, standing desks, and conference tables for new office wing.',
   '2025-07-20 23:59:59', 'Draft', 'u-officer-001'),

  ('rfq-003', 'VB-RFQ-2025-003', 'Warehouse Logistics Contract Q3',
   'Third-party logistics for warehouse operations in Western region.',
   '2025-06-30 23:59:59', 'PO Generated', 'u-officer-001'),

  ('rfq-004', 'VB-RFQ-2025-004', 'Raw Material Supply - Steel Plates',
   'Supply of MS steel plates (grade IS 2062) for manufacturing unit.',
   '2025-08-01 23:59:59', 'Awaiting Quotes', 'u-officer-001'),

  ('rfq-005', 'VB-RFQ-2025-005', 'Security System Installation',
   'CCTV cameras, access control, and monitoring setup for 3 facilities.',
   '2025-07-25 23:59:59', 'Closed', 'u-officer-001');

-- RFQ Items
INSERT INTO rfq_items (rfq_id, name, description, qty, unit, spec_notes) VALUES
  ('rfq-001', 'Dell PowerEdge R750',       'Rack server with 64GB RAM',    5,  'Units',  'Must include 3-year warranty'),
  ('rfq-001', 'Cisco Catalyst 9300 Switch', '48-port managed switch',      10, 'Units',  'PoE+ required'),
  ('rfq-001', 'Windows Server 2022 License','Datacenter edition',          5,  'Licenses', NULL),
  ('rfq-003', 'Warehouse Operations',       'Monthly logistics management', 12, 'Months', 'Western region only'),
  ('rfq-004', 'MS Steel Plates 10mm',       'IS 2062 grade, 10mm thick',   500,'Kg',     'Mill test certificate required'),
  ('rfq-004', 'MS Steel Plates 16mm',       'IS 2062 grade, 16mm thick',   300,'Kg',     NULL);

-- RFQ-Vendor assignments
INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES
  ('rfq-001', 'v-001'), ('rfq-001', 'v-006'),
  ('rfq-003', 'v-002'), ('rfq-003', 'v-007'),
  ('rfq-004', 'v-003'), ('rfq-004', 'v-008');

-- ============================================================
-- QUOTATIONS
-- ============================================================
INSERT INTO quotations (id, rfq_id, vendor_id, delivery_days, total_amount, notes, status, submitted_at) VALUES
  ('q-001', 'rfq-001', 'v-001', 21, 2450000.00, 'Includes installation and setup.', 'Submitted', '2025-06-20 10:30:00'),
  ('q-002', 'rfq-001', 'v-006', 14, 2680000.00, 'Express delivery available.',       'Submitted', '2025-06-21 14:15:00'),
  ('q-003', 'rfq-003', 'v-002', 30, 1800000.00, '12-month contract pricing.',       'Selected',  '2025-06-15 09:00:00'),
  ('q-004', 'rfq-003', 'v-007', 30, 2100000.00, 'Includes insurance coverage.',      'Rejected',  '2025-06-16 11:00:00');

-- Quotation line items
INSERT INTO quotation_line_items (quotation_id, item_name, unit_price, qty, total) VALUES
  ('q-001', 'Dell PowerEdge R750',        320000.00, 5,  1600000.00),
  ('q-001', 'Cisco Catalyst 9300 Switch',  55000.00, 10,  550000.00),
  ('q-001', 'Windows Server 2022 License', 60000.00, 5,   300000.00),
  ('q-002', 'Dell PowerEdge R750',        350000.00, 5,  1750000.00),
  ('q-002', 'Cisco Catalyst 9300 Switch',  58000.00, 10,  580000.00),
  ('q-002', 'Windows Server 2022 License', 70000.00, 5,   350000.00),
  ('q-003', 'Warehouse Operations',       150000.00, 12, 1800000.00),
  ('q-004', 'Warehouse Operations',       175000.00, 12, 2100000.00);

-- ============================================================
-- APPROVALS
-- ============================================================
INSERT INTO approvals (id, quotation_id, rfq_id, requested_by, approved_by, status, remarks) VALUES
  ('a-001', 'q-003', 'rfq-003', 'u-officer-001', 'u-manager-001', 'Approved', 'Best value for money. Proceed with SpeedLine.'),
  ('a-002', 'q-001', 'rfq-001', 'u-officer-001', NULL,            'Pending',  NULL);

INSERT INTO approval_timeline (approval_id, status, user_id, note) VALUES
  ('a-001', 'Pending',      'u-officer-001', 'Approval requested for SpeedLine Logistics'),
  ('a-001', 'Under Review', 'u-manager-001', 'Reviewing quotation details'),
  ('a-001', 'Approved',     'u-manager-001', 'Best value for money. Proceed with SpeedLine.'),
  ('a-002', 'Pending',      'u-officer-001', 'Approval requested for TechNova Solutions');

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
INSERT INTO purchase_orders (id, po_number, quotation_id, rfq_id, vendor_id, delivery_address, terms, grand_total, cgst, sgst, igst, status) VALUES
  ('po-001', 'VB-PO-2025-001', 'q-003', 'rfq-003', 'v-002',
   'Warehouse Block C, MIDC Bhosari, Pune, MH 411026',
   'Net 30 days. Delivery within 7 days of PO date.',
   2124000.00, 162000.00, 162000.00, 0.00, 'Issued');

INSERT INTO po_items (po_id, name, qty, unit_price, gst, total) VALUES
  ('po-001', 'Warehouse Operations', 12, 150000.00, 27000.00, 177000.00);

-- ============================================================
-- INVOICES
-- ============================================================
INSERT INTO invoices (id, invoice_number, po_id, vendor_id, subtotal, cgst, sgst, igst, total_tax, grand_total, bank_name, account_no, ifsc, bank_branch, payment_terms, due_date, status) VALUES
  ('inv-001', 'VB-INV-2025-001', 'po-001', 'v-002',
   1800000.00, 162000.00, 162000.00, 0.00, 324000.00, 2124000.00,
   'HDFC Bank', '50100123456789', 'HDFC0001234', 'Bandra West, Mumbai',
   'Net 30 days from invoice date', '2025-08-15', 'Sent');

INSERT INTO invoice_line_items (invoice_id, name, qty, unit_price, gst, total) VALUES
  ('inv-001', 'Warehouse Operations', 12, 150000.00, 27000.00, 177000.00);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, details) VALUES
  ('RFQ',      'rfq-001', 'Created',   'u-officer-001', 'RFQ VB-RFQ-2025-001 created'),
  ('RFQ',      'rfq-001', 'Published', 'u-officer-001', 'RFQ published and sent to 2 vendors'),
  ('RFQ',      'rfq-003', 'Created',   'u-officer-001', 'RFQ VB-RFQ-2025-003 created'),
  ('RFQ',      'rfq-003', 'Approved',  'u-manager-001', 'RFQ approved by manager'),
  ('Quotation','q-001',   'Submitted', 'u-vendor-001',  'Quotation submitted by TechNova Solutions'),
  ('Quotation','q-003',   'Selected',  'u-officer-001', 'SpeedLine Logistics selected as vendor'),
  ('Approval', 'a-001',   'Approved',  'u-manager-001', 'Approval granted for SpeedLine'),
  ('PO',       'po-001',  'Created',   'u-officer-001', 'PO VB-PO-2025-001 generated'),
  ('Invoice',  'inv-001', 'Created',   'u-officer-001', 'Invoice VB-INV-2025-001 generated from PO'),
  ('Invoice',  'inv-001', 'Sent',      'u-officer-001', 'Invoice sent to vendor via email');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES
  ('u-officer-001', 'Quotation Received',     'TechNova Solutions submitted a quotation for RFQ VB-RFQ-2025-001.',     'info',    1, '/rfqs/rfq-001'),
  ('u-officer-001', 'Approval Granted',        'Manager approved your quotation selection for RFQ VB-RFQ-2025-003.',   'success', 1, '/approvals/a-001'),
  ('u-manager-001', 'New Approval Request',    'Rahul Sharma requested approval for RFQ VB-RFQ-2025-001.',            'warning', 0, '/approvals/a-002'),
  ('u-vendor-001',  'New RFQ Assigned',         'You have been assigned to RFQ: Annual IT Infrastructure Upgrade.',     'info',    0, '/rfqs/rfq-001'),
  ('u-vendor-002',  'Purchase Order Issued',   'A purchase order VB-PO-2025-001 has been issued for your quotation.',  'success', 0, '/orders/po-001');
