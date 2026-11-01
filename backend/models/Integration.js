const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'quickbooks',
        'xero',
        'sap_concur',
        'expensify',
        'google_cloud_vision',
        'tesseract_ocr',
        'exchange_rate_api',
      ],
    },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['Accounting', 'ERP', 'Receipt OCR', 'Currency Service'],
      default: 'Accounting',
    },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'configured', 'error'],
      default: 'disconnected',
    },
    credentials: {
      apiKey: { type: String, default: '' },
      clientId: { type: String, default: '' },
      clientSecret: { type: String, default: '' },
      realmId: { type: String, default: '' },
      endpointUrl: { type: String, default: '' },
      isSandbox: { type: Boolean, default: true },
    },
    lastSyncTime: { type: Date, default: null },
    lastSyncStatus: { type: String, default: 'Never Synced' },
    lastErrorMessage: { type: String, default: '' },
    syncCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Integration', integrationSchema);
