const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-management',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  OCR_PROVIDER: process.env.OCR_PROVIDER || 'tesseract',
  AI_PROVIDER: process.env.AI_PROVIDER || 'rule_based',
  BASE_CURRENCY: process.env.BASE_CURRENCY || 'USD',
  DEFAULT_MILEAGE_RATE: parseFloat(process.env.DEFAULT_MILEAGE_RATE) || 0.50,
  MILEAGE_UNIT: process.env.MILEAGE_UNIT || 'km',
};
