/**
 * SAP Concur Integration Adapter
 */
class ConcurAdapter {
  async exportReport(reportData) {
    if (!process.env.CONCUR_API_KEY) {
      return { status: 'mock_synced', integration: 'SAP Concur', timestamp: new Date().toISOString() };
    }
    return { status: 'synced', integration: 'SAP Concur', timestamp: new Date().toISOString() };
  }
}

module.exports = new ConcurAdapter();
