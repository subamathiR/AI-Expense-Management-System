const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry
 */
const createAuditLog = async ({ userId, action, entityType, entityId, details = {}, ipAddress = '' }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Audit log creation failed:', error.message);
    // Don't throw - audit logging should not break the main flow
  }
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Get client IP address from request
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || '';
};

module.exports = {
  createAuditLog,
  formatCurrency,
  getClientIp,
};
