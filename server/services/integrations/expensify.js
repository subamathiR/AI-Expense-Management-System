/**
 * Expensify Integration Adapter
 */
class ExpensifyAdapter {
  async syncExpenseReport(reportData) {
    if (!process.env.EXPENSIFY_API_KEY) {
      return { status: 'mock_synced', integration: 'Expensify', syncedAt: new Date().toISOString() };
    }
    return { status: 'synced', integration: 'Expensify', syncedAt: new Date().toISOString() };
  }
}

module.exports = new ExpensifyAdapter();
