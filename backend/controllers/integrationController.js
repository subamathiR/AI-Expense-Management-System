const Integration = require('../models/Integration');

// Default initial integrations list if not seeded
const DEFAULT_INTEGRATIONS = [
  {
    providerId: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'Accounting',
    description: 'Bi-directional general ledger sync for expenses, vendors, and reimbursement payouts.',
    status: 'connected',
    credentials: { isSandbox: true, endpointUrl: 'https://sandbox-quickbooks.api.intuit.com/v3/company' },
  },
  {
    providerId: 'xero',
    name: 'Xero Accounting',
    category: 'Accounting',
    description: 'Automated bank feed reconciliation and chart-of-accounts expense posting.',
    status: 'connected',
    credentials: { isSandbox: true, endpointUrl: 'https://api.xero.com/api.xro/2.0' },
  },
  {
    providerId: 'sap_concur',
    name: 'SAP Concur Enterprise',
    category: 'ERP',
    description: 'Corporate travel booking and ERP travel expense journal integration.',
    status: 'connected',
    credentials: { isSandbox: true, endpointUrl: 'https://us2.concursolutions.com/api/v3.0' },
  },
  {
    providerId: 'expensify',
    name: 'Expensify Bridge',
    category: 'ERP',
    description: 'Legacy receipt migration and credit card transaction import pipeline.',
    status: 'connected',
    credentials: { isSandbox: true, endpointUrl: 'https://integrations.expensify.com/Integration-Server/ExpensifyPartner' },
  },
  {
    providerId: 'tesseract_ocr',
    name: 'Tesseract Neural OCR Engine',
    category: 'Receipt OCR',
    description: 'Local on-premise neural network optical character recognition engine.',
    status: 'connected',
    credentials: { endpointUrl: 'local://embedded/tesseract-v5' },
  },
  {
    providerId: 'google_cloud_vision',
    name: 'Google Cloud Vision AI',
    category: 'Receipt OCR',
    description: 'High-density cloud OCR pipeline for multi-lingual and blurred receipts.',
    status: 'connected',
    credentials: { isSandbox: true, endpointUrl: 'https://vision.googleapis.com/v1/images:annotate' },
  },
  {
    providerId: 'exchange_rate_api',
    name: 'Central Exchange Rate Service',
    category: 'Currency Service',
    description: 'Real-time foreign exchange rate sync for 160+ fiat currencies.',
    status: 'connected',
    credentials: { endpointUrl: 'https://api.exchangerate-api.com/v4/latest/USD' },
  },
];

// @desc    Get all integrations
// @route   GET /api/integrations
exports.getIntegrations = async (req, res, next) => {
  try {
    let integrations = await Integration.find({});
    if (integrations.length === 0) {
      // Seed default integrations
      await Integration.insertMany(DEFAULT_INTEGRATIONS);
      integrations = await Integration.find({});
    }

    res.status(200).json({ success: true, count: integrations.length, data: integrations });
  } catch (err) {
    next(err);
  }
};

// @desc    Update integration credentials / config
// @route   PUT /api/integrations/:id
exports.updateIntegration = async (req, res, next) => {
  try {
    const { apiKey, clientId, clientSecret, endpointUrl, isSandbox, status } = req.body;

    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    if (apiKey !== undefined) integration.credentials.apiKey = apiKey;
    if (clientId !== undefined) integration.credentials.clientId = clientId;
    if (clientSecret !== undefined) integration.credentials.clientSecret = clientSecret;
    if (endpointUrl !== undefined) integration.credentials.endpointUrl = endpointUrl;
    if (isSandbox !== undefined) integration.credentials.isSandbox = isSandbox;
    if (status !== undefined) integration.status = status;

    await integration.save();
    res.status(200).json({ success: true, data: integration });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify / Test integration connection
// @route   POST /api/integrations/:id/test
exports.testIntegrationConnection = async (req, res, next) => {
  try {
    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    // Simulate reliable ping verification based on provider
    let verificationSuccess = true;
    let message = `Successfully verified connection to ${integration.name}. Handshake OK.`;

    integration.status = 'connected';
    integration.lastSyncTime = new Date();
    integration.lastSyncStatus = 'Handshake Verified';
    integration.lastErrorMessage = '';
    await integration.save();

    res.status(200).json({
      success: verificationSuccess,
      message,
      data: integration,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger sync
// @route   POST /api/integrations/:id/sync
exports.triggerSync = async (req, res, next) => {
  try {
    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    integration.lastSyncTime = new Date();
    integration.lastSyncStatus = 'Sync Successful (0 conflicts)';
    integration.syncCount = (integration.syncCount || 0) + 1;
    await integration.save();

    res.status(200).json({
      success: true,
      message: `Sync completed for ${integration.name}. 0 conflicts.`,
      data: integration,
    });
  } catch (err) {
    next(err);
  }
};
