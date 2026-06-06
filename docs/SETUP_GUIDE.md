# VendorBridge — Setup Guide

> **Document Status**: Current as of June 2026  
> **Last Updated**: June 2026

Complete setup instructions for development and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment](#development-environment)
3. [Production Environment](#production-environment)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0 or higher
- **Git**: For version control
- **4GB RAM**: Minimum for development
- **2GB Disk Space**: For dependencies and database

### Verify Installation

```bash
# Check Node.js version
node --version          # Should be v18+

# Check npm version
npm --version           # Should be v9+

# Check MySQL version
mysql --version         # Should be v8+

# Check Git version
git --version           # Should be v2.30+
```

---

## Development Environment

### Step 1: Clone Repository

```bash
# Clone the project
git clone https://github.com/YashvardhanJani/VendorBridge
cd VendorBridge

# Verify structure
ls -la
# You should see: client/, server/, database/, docs/, README.md
```

### Step 2: Database Setup

#### Create MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# In MySQL shell:
CREATE DATABASE IF NOT EXISTS vendor;
USE vendor;

# Exit MySQL
exit
```

#### Load Schema and Seed Data

```bash
# From project root
cd database

# Load schema
mysql -u root -p vendor < schema.sql

# Load seed data (test data)
mysql -u root -p vendor < seed.sql

# Verify setup
mysql -u root -p vendor -e "SELECT COUNT(*) FROM users;"
```

**Expected output**: Should show record count from users table

### Step 3: Backend Setup

```bash
# Navigate to server folder
cd ../server

# Install dependencies
npm install

# Create .env file (copy from template)
cp .env.example .env    # If example exists, or create manually

# Edit .env with your configuration
# Open in your editor and update:
# - PORT (default: 5000)
# - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (use strong random string)
```

**Example .env file**:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vendor

# Authentication
JWT_SECRET=your_super_secret_jwt_signing_key_change_in_production
JWT_EXPIRY=7d

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional, for EmailJS)
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
```

#### Start Backend

```bash
# From server/ folder
npm run dev

# Expected output:
# Server running on http://localhost:5000
# Database connected successfully
```

✅ **Backend is now running!**

### Step 4: Frontend Setup

Open **new terminal** window:

```bash
# Navigate to client folder (from project root)
cd client

# Install dependencies
npm install

# Create .env file (if needed)
# Create a .env.local file in client/
```

**Example .env.local**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Start Frontend

```bash
# From client/ folder
npm run dev

# Expected output:
# VITE v... ready in ... ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

✅ **Frontend is now running!**

### Step 5: Verify Installation

Open your browser and navigate to:

```
http://localhost:5173
```

**You should see**:
- VendorBridge login page
- Login form with email and password fields

Try logging in with test credentials:

| Role | Email | Password |
|------|-------|----------|
| Officer | officer@vendorbridge.com | test123 |
| Manager | manager@vendorbridge.com | test123 |
| Vendor | vendor@vendorbridge.com | test123 |

If login succeeds, you're all set! ✅

---

## Production Environment

### Step 1: Code Optimization

```bash
# Build backend
cd server
npm run build

# Build frontend
cd ../client
npm run build

# Verify builds created dist/ folders
ls -la server/dist
ls -la client/dist
```

### Step 2: Environment Configuration

Create production `.env` file:

```env
# Server
PORT=5000
NODE_ENV=production

# Database (use production database)
DB_HOST=prod-db.example.com
DB_PORT=3306
DB_USER=prod_user
DB_PASSWORD=very_secure_password_here
DB_NAME=vendor_prod

# Security
JWT_SECRET=use_a_very_long_random_string_at_least_32_chars_here
JWT_EXPIRY=7d

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/vendorbridge/app.log

# CORS (production domain only)
CORS_ORIGIN=https://yourdomain.com

# Optional: Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Database Backup

```bash
# Create production database backup
mysqldump -u prod_user -p vendor_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### Step 4: Docker Setup (Optional)

Create `Dockerfile` for server:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: vendor
    volumes:
      - ./database:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASSWORD: root
      DB_NAME: vendor
    depends_on:
      - db

  frontend:
    build: ./client
    ports:
      - "80:5173"
```

Run with Docker:

```bash
docker-compose up
```

### Step 5: Reverse Proxy Setup (Nginx)

Create `/etc/nginx/sites-available/vendorbridge`:

```nginx
upstream backend {
    server localhost:5000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        root /var/www/vendorbridge;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/vendorbridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Environment Variables in Production

**Never commit `.env` files**. Instead:

1. Store in secure environment management system
2. Use deployment platform's secret management (AWS Secrets Manager, etc.)
3. Load at runtime before starting application

```bash
# Example: Load from secure storage and start
export $(cat /secure/location/.env | xargs)
npm start
```

---

## Configuration

### Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | 5000 | Server port |
| `NODE_ENV` | string | development | Environment (development, production) |
| `DB_HOST` | string | localhost | Database host |
| `DB_PORT` | number | 3306 | Database port |
| `DB_USER` | string | root | Database user |
| `DB_PASSWORD` | string | — | Database password |
| `DB_NAME` | string | vendor | Database name |
| `JWT_SECRET` | string | — | Secret for JWT signing (required!) |
| `JWT_EXPIRY` | string | 7d | Token expiration time |
| `LOG_LEVEL` | string | info | Log verbosity (debug, info, warn, error) |
| `CORS_ORIGIN` | string | * | Allowed CORS origin |

### Database Connection Pool

```typescript
// server/src/config/db.ts
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

### Logging Configuration

```typescript
// server/src/config/logger.ts
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});
```

---

## Database Setup

### Schema Initialization

The database schema is defined in `database/schema.sql` and contains:

- **Users table**: Authentication & roles
- **Vendors table**: Vendor profiles
- **RFQs table**: Request for Quotations
- **Quotations table**: Vendor bids
- **Approvals table**: Multi-level approval workflow
- **Purchase_Orders table**: Generated orders
- **Invoices table**: Billing documents
- **Activity_Logs table**: Audit trail

### Seed Data

Test data is in `database/seed.sql`:

- 4 test users (Officer, Manager, Vendor, Admin)
- 3 test vendors
- Sample RFQs and quotations
- Test data for all workflows

### Backup & Restore

```bash
# Backup database
mysqldump -u root -p vendor > backup.sql

# Restore database
mysql -u root -p vendor < backup.sql

# Restore to specific database
mysql -u root -p new_database < backup.sql
```

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot connect to database"

**Solution**:
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify .env file has correct credentials
cat server/.env | grep DB_

# Check database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'vendor';"
```

#### Issue: "Port 5000 already in use"

**Solution** (Linux/macOS):
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

**Solution** (Windows):
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or use different port
$env:PORT=5001; npm run dev
```

#### Issue: "Module not found" errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache if needed
npm cache clean --force
```

#### Issue: "JWT token expired"

**Solution**: 
- Users need to login again
- Token is valid for 7 days by default
- Extend JWT_EXPIRY if needed

#### Issue: "CORS error in browser console"

**Solution**:
```env
# Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:5173
```

#### Issue: Frontend shows blank page

**Solution**:
```bash
# Check if API is reachable
curl http://localhost:5000/api/auth/me

# Check browser console for errors (F12)

# Clear browser cache and rebuild
cd client
rm -rf .vite dist
npm run build
```

### Getting Help

1. Check this document's troubleshooting section
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Review logs in `server/logs/`

---

<div align="center">

**[← Back to Documentation Index](./README.md)**

</div>
