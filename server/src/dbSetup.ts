import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from './config/logger';

dotenv.config();

const runSetup = async () => {
  logger.info('Starting MySQL Database Setup...');

  // Connect without database first to ensure database is created
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'whitetulip99',
    multipleStatements: true,
  });

  try {
    // Drop existing tables cleanly by disabling foreign key checks first
    logger.info('Cleaning up existing tables if any...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    const tablesToDrop = [
      'notifications', 'activity_logs', 'invoice_line_items', 'invoices',
      'po_items', 'purchase_orders', 'approval_timeline', 'approvals',
      'quotation_line_items', 'quotations', 'rfq_activity_log', 'rfq_attachments',
      'rfq_vendors', 'rfq_items', 'rfqs', 'vendor_documents', 'vendors', 'users'
    ];

    for (const table of tablesToDrop) {
      await connection.query(`DROP TABLE IF EXISTS vendor.${table};`);
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    logger.info('✅ Database cleaned up.');

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../database/seed.sql');

    logger.info(`Reading schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    logger.info('Executing Schema SQL...');
    await connection.query(schemaSql);
    logger.info('✅ Schema SQL executed successfully.');

    logger.info(`Reading seed data from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    logger.info('Executing Seed SQL...');
    await connection.query(seedSql);
    logger.info('✅ Seed SQL executed successfully.');

    logger.info('🎉 MySQL Database Setup Completed Successfully!');
  } catch (error) {
    logger.error('❌ Error during MySQL Database Setup:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

runSetup();
