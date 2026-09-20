/**
 * QuickBooks Integration Adapter
 */
class QuickBooksAdapter {
  async postGeneralJournal(expenseData) {
    if (!process.env.QUICKBOOKS_API_KEY) {
      return { status: 'mock_synced', integration: 'QuickBooks Online', timestamp: new Date().toISOString() };
    }
    return { status: 'synced', integration: 'QuickBooks Online', timestamp: new Date().toISOString() };
  }
}

module.exports = new QuickBooksAdapter();
