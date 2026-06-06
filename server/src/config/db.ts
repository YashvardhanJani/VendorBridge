import mysql from 'mysql2/promise';
import { logger } from './logger';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'whitetulip99',
  database: process.env.DB_NAME || 'vendor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ MySQL Database connected successfully.');
    connection.release();
  } catch (error: any) {
    logger.error('❌ MySQL Database connection failed. Make sure your local MySQL is running.', error);
    // Since this might run in environments without MySQL active initially, we log instead of crashing
    // to allow front-end and mocked dev servers to still boot.
  }
};
