import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { logger } from './config/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', {
  stream: { write: (message: string) => logger.http(message.trim()) },
}));

// --------------- Health Check ---------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'VendorBridge API is running', timestamp: new Date().toISOString() });
});

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import vendorRoutes from './routes/vendorRoutes';
import rfqRoutes from './routes/rfqRoutes';
import quotationRoutes from './routes/quotationRoutes';
import approvalRoutes from './routes/approvalRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import activityLogRoutes from './routes/activityLogRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportsRoutes from './routes/reportsRoutes';

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportsRoutes);

// --------------- 404 Handler ---------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// --------------- Global Error Handler ---------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// --------------- Start Server ---------------
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 VendorBridge server running on port ${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
