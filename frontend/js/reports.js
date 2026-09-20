/**
 * Expense Reports Module — Handles generating and submitting expense reports
 */
document.addEventListener('DOMContentLoaded', async () => {
  const reportsTableBody = document.querySelector('#reports-table tbody');
  const createReportForm = document.getElementById('create-report-form');

  if (reportsTableBody) {
    await loadReports();
  }

  if (createReportForm) {
    createReportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('report-title')?.value;
      const period = document.getElementById('report-period')?.value;

      try {
        await API.createReport({ title, period });
        showToast('Expense report created successfully!', 'success');
        if (reportsTableBody) await loadReports();
      } catch (err) {
        showToast(err.message || 'Failed to create report', 'error');
      }
    });
  }

  async function loadReports() {
    try {
      const res = await API.getReports();
      const reports = res.data || [];

      if (reports.length === 0) {
        reportsTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2rem;" class="text-muted">
              No expense reports found.
            </td>
          </tr>
        `;
        return;
      }

      reportsTableBody.innerHTML = reports.map(r => `
        <tr>
          <td><strong>${formatText(r.title)}</strong></td>
          <td>${r.period || 'August 2026'}</td>
          <td>${formatCurrency(r.totalAmount || 0)}</td>
          <td><span class="badge badge-${(r.status || 'draft').toLowerCase()}">${r.status}</span></td>
          <td>
            ${r.status === 'draft' ? `<button onclick="submitReport('${r._id}')" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Submit</button>` : `<span class="text-muted" style="font-size: 0.75rem;">Submitted</span>`}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      reportsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 1rem;">
            Failed to load reports.
          </td>
        </tr>
      `;
    }
  }

  window.submitReport = async (id) => {
    try {
      await API.submitReport(id);
      showToast('Expense report submitted for review', 'success');
      await loadReports();
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    }
  };
});
