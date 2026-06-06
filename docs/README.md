# VendorBridge Documentation

Welcome to VendorBridge ERP documentation. This folder contains comprehensive guides for developers, administrators, and users.

## 📚 Documentation Index

### Getting Started
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step installation and configuration
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and project structure
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Developer guidelines and standards

### Core Documentation
- **[API_CONTRACT.md](./API_CONTRACT.md)** - REST API endpoints and contract (frozen)
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema and relationships (frozen)
- **[STATUS_FLOWS.md](./STATUS_FLOWS.md)** - Business process state machines

---

## 🗂 Quick Navigation

### For First-Time Setup
1. Start with [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Understand the [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Review the [STATUS_FLOWS.md](./STATUS_FLOWS.md)

### For API Development
1. Review [API_CONTRACT.md](./API_CONTRACT.md)
2. Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
3. Follow [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 🔑 Key Concepts

### Roles in VendorBridge
- **Officer**: Creates RFQs, manages vendors, initiates purchase processes
- **Manager**: Reviews and approves procurement requests
- **Vendor**: Submits quotations, delivers goods, invoices payments
- **Admin**: System administration and user management

### Procurement Lifecycle
1. **RFQ Creation** → Officer creates a Request for Quotation
2. **Quotation** → Vendor submits bids for RFQ items
3. **Approval** → Manager reviews and approves the selected quotation
4. **Purchase Order** → Auto-generated upon approval
5. **Delivery** → Vendor marks goods as delivered
6. **Invoicing** → Vendor generates invoice
7. **Payment** → Officer settles payment
8. **Closed** → Transaction complete

### Key Features
- 🔐 **Role-Based Access Control**: Different views for different user roles
- 📊 **GST Compliance**: Automatic tax calculation (CGST+SGST or IGST)
- 📈 **Analytics**: Real-time dashboards for procurement insights
- 📝 **Audit Trail**: Complete activity logging for compliance
- 🔔 **Notifications**: Real-time status updates

---

## 📋 Common Tasks

### Setup a new development environment
→ See [SETUP_GUIDE.md](./SETUP_GUIDE.md#development-environment)

### Add a new API endpoint
→ See [API_CONTRACT.md](./API_CONTRACT.md) & [CONTRIBUTING.md](./CONTRIBUTING.md#adding-new-endpoints)

### Modify the database schema
→ See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) & [CONTRIBUTING.md](./CONTRIBUTING.md#schema-changes)


### Understand business workflows
→ See [STATUS_FLOWS.md](./STATUS_FLOWS.md)

---

## ⚠️ Frozen Documents

The following documents are **frozen** and should not be modified without careful consideration:

- **API_CONTRACT.md**: API endpoints and contracts
- **DATABASE_SCHEMA.md**: Database structure and field definitions
- **STATUS_FLOWS.md**: Business process state machines

Any changes to these documents must be:
1. Discussed with the team
2. Updated in the document
3. Reflected in code changes
4. Tested thoroughly
5. Documented in commit messages

---

## 🚨 Support

### Need Help?
- Check the relevant documentation file
- Review the [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting) troubleshooting section
- Consult [CONTRIBUTING.md](./CONTRIBUTING.md#common-issues) for common issues

### Found an Issue?
- Document the problem
- Check existing issues
- Create a detailed bug report
- Include logs and stack traces

---

## 📅 Version Information

**Current Version**: 1.0.0  
**Last Updated**: June 2026 

---

<div align="center">

**VendorBridge ERP Documentation**

[← Back to Main README](../README.md)

</div>
