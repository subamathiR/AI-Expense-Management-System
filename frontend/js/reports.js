/* ===================================================================
   EXPENSEAI — EXPENSE REPORTS CONTROLLER SCRIPT
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  document.getElementById('report-start').value = firstDay;
  document.getElementById('report-end').value = today;

  loadReports();
});

async function loadReports() {
  const tbody = document.getElementById('reports-table-tbody');
  if (!tbody) return;

  try {
    const res = await api.get('/reports');
    const reports = res.data || [];

    if (reports.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 35px; color: var(--text-muted);">
            No expense reports compiled yet. Fill the form above to generate your first report package.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = reports.map(r => {
      const statusBadge =
        r.status === 'approved' ? 'badge-approved' :
        r.status === 'reimbursed' ? 'badge-reimbursed' : 'badge-pending';

      return `
        <tr>
          <td><strong class="font-mono text-brand">${r.reportNumber}</strong></td>
          <td><strong>${r.title}</strong></td>
          <td style="font-size: 13px; color: var(--text-secondary);">${formatDate(r.periodStart)} – ${formatDate(r.periodEnd)}</td>
          <td class="amount-cell">${formatMoney(r.totalAmount, r.currency)}</td>
          <td><span class="badge ${statusBadge}">${r.status.toUpperCase()}</span></td>
          <td style="color: var(--text-muted); font-size: 12.5px;">${formatDate(r.createdAt)}</td>
          <td style="text-align: center; white-space: nowrap;">
            <a href="/api/reports/${r._id}/export-csv?token=${api.getToken()}" class="btn btn-secondary btn-sm" title="Export CSV">
              <i data-lucide="download"></i> CSV
            </a>
            <button class="btn btn-ghost btn-sm" onclick="viewPrintableReport('${r._id}')" title="Printable Statement">
              <i data-lucide="eye"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #DC2626; padding: 20px;">
          Failed to load reports: ${err.message}
        </td>
      </tr>
    `;
  }
}

document.getElementById('generate-report-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('report-title').value.trim();
  const periodStart = document.getElementById('report-start').value;
  const periodEnd = document.getElementById('report-end').value;

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> <span>Compiling...</span>`;

  try {
    await api.post('/reports', { title, periodStart, periodEnd });
    showToast('Expense report compiled and submitted successfully!', 'success');
    document.getElementById('report-title').value = '';
    loadReports();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="file-text"></i> Compile & Submit Report`;
    if (window.lucide) window.lucide.createIcons();
  }
});

async function viewPrintableReport(id) {
  try {
    const res = await api.get(`/reports/${id}`);
    const r = res.data;
    if (!r) return;

    document.getElementById('modal-report-title').innerText = `${r.reportNumber} — ${r.title}`;

    const itemsHtml = r.expenseIds && r.expenseIds.length > 0
      ? r.expenseIds.map(exp => `
          <tr>
            <td>${formatDate(exp.date)}</td>
            <td><strong>${exp.merchant}</strong></td>
            <td>${exp.category}</td>
            <td>${exp.policyStatus}</td>
            <td style="text-align: right; font-weight: 700;">$${exp.amount.toFixed(2)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No line items attached.</td></tr>';

    document.getElementById('modal-report-content').innerHTML = `
      <div style="border-bottom: 2px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 16px;">
        <div class="flex justify-between items-center">
          <div>
            <h3 style="margin-bottom: 4px;">ExpenseAI Official Expense Statement</h3>
            <div style="font-size: 13px; color: var(--text-muted);">Report No: <strong>${r.reportNumber}</strong> • Status: <strong>${r.status.toUpperCase()}</strong></div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: var(--text-muted);">Total Summary</div>
            <div style="font-family: var(--font-heading); font-size: 26px; font-weight: 800; color: var(--brand-primary);">${formatMoney(r.totalAmount, r.currency)}</div>
          </div>
        </div>
      </div>

      <div class="grid-2" style="font-size: 13px; margin-bottom: 16px;">
        <div><strong>Employee:</strong> ${r.userId ? r.userId.name : 'Employee'} (${r.userId ? r.userId.department : 'General'})</div>
        <div><strong>Period:</strong> ${formatDate(r.periodStart)} through ${formatDate(r.periodEnd)}</div>
      </div>

      <table class="data-table" style="font-size: 12px; margin-bottom: 16px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Merchant</th>
            <th>Category</th>
            <th>Policy Status</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 10px;">
        This document represents an authenticated expense report audited against company policies. Generated on ${new Date().toLocaleString()}.
      </div>
    `;

    document.getElementById('report-modal').classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    showToast('Failed to load report statement: ' + err.message, 'error');
  }
}

function closeReportModal() {
  document.getElementById('report-modal').classList.remove('active');
}
