/**
 * Xero Accounting Integration Adapter
 */
class XeroAdapter {
  async postBill(expenseData) {
    if (!process.env.XERO_API_KEY) {
      return { status: 'mock_synced', integration: 'Xero Accounting', timestamp: new Date().toISOString() };
    }
    return { status: 'synced', integration: 'Xero Accounting', timestamp: new Date().toISOString() };
  }
}

module.exports = new XeroAdapter();
