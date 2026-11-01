/* ===================================================================
   EXPENSEAI — EXPENSES MANAGEMENT SCRIPT
   List, filter, view details, policy checks, split breakdown, delete
   =================================================================== */

let allExpenses = [];

document.addEventListener('DOMContentLoaded', () => {
  loadExpenses();

  // Attach filter event listeners
  document.getElementById('filter-search').addEventListener('input', debounce(loadExpenses, 300));
  document.getElementById('filter-category').addEventListener('change', loadExpenses);
  document.getElementById('filter-status').addEventListener('change', loadExpenses);
  document.getElementById('filter-policy').addEventListener('change', loadExpenses);

  // Check URL query parameters for direct open
  const urlParams = new URLSearchParams(window.location.search);
  const directId = urlParams.get('id');
  if (directId) {
    setTimeout(() => viewExpenseDetails(directId), 500);
  }
});

async function loadExpenses() {
  const tbody = document.getElementById('expenses-table-body');
  if (!tbody) return;

  const search = document.getElementById('filter-search').value.trim();
  const category = document.getElementById('filter-category').value;
  const status = document.getElementById('filter-status').value;
  const policyStatus = document.getElementById('filter-policy').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);
  if (status && status !== 'All') params.append('status', status);
  if (policyStatus && policyStatus !== 'All') params.append('policyStatus', policyStatus);

  try {
    const res = await api.get(`/expenses?${params.toString()}`);
    allExpenses = res.data || [];

    if (allExpenses.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No expense records matching the selected filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = allExpenses.map(exp => {
      const policyBadgeClass =
        exp.policyStatus === 'within_policy' ? 'badge-within-policy' :
        exp.policyStatus === 'requires_review' ? 'badge-requires-review' : 'badge-violation';

      const statusBadgeClass =
        exp.status === 'approved' ? 'badge-approved' :
        exp.status === 'reimbursed' ? 'badge-reimbursed' :
        exp.status === 'rejected' ? 'badge-rejected' : 'badge-pending';

      const isForeign = exp.currency && exp.currency !== 'USD';

      return `
        <tr>
          <td style="color: var(--text-secondary); white-space: nowrap;">${formatDate(exp.date)}</td>
          <td>
            <strong>${exp.merchant}</strong>
            ${exp.receiptUrl ? '<span title="Receipt Attached"><i data-lucide="paperclip" style="width: 13px; height: 13px; display: inline-block; vertical-align: middle; margin-left: 4px; color: var(--brand-primary);"></i></span>' : ''}
            ${exp.splitDetails && exp.splitDetails.length > 0 ? '<span class="badge badge-draft" style="font-size: 10px; margin-left: 6px;">Split</span>' : ''}
          </td>
          <td><span class="category-tag">${exp.category}</span></td>
          <td style="font-size: 13px; color: var(--text-secondary);">${exp.paymentMethod}</td>
          <td><span class="badge ${policyBadgeClass}">${exp.policyStatus.replace('_', ' ')}</span></td>
          <td><span class="badge ${statusBadgeClass}">${exp.status.replace('_', ' ')}</span></td>
          <td class="amount-cell">
            ${formatMoney(exp.convertedAmount || exp.amount, exp.reportingCurrency || 'USD')}
            ${isForeign ? `<div style="font-size: 10px; color: var(--text-muted); font-weight: normal;">${exp.amount.toFixed(2)} ${exp.currency}</div>` : ''}
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <button class="btn btn-ghost btn-sm" onclick="viewExpenseDetails('${exp._id}')" title="View Full Audit Details">
              <i data-lucide="eye"></i>
            </button>
            ${exp.status === 'submitted' || exp.status === 'draft' ? `
              <button class="btn btn-ghost btn-sm" style="color: #DC2626;" onclick="deleteExpense('${exp._id}')" title="Delete Claim">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #DC2626; padding: 25px;">
          Failed to load expenses: ${err.message}
        </td>
      </tr>
    `;
  }
}

async function viewExpenseDetails(id) {
  try {
    const res = await api.get(`/expenses/${id}`);
    const exp = res.data;
    if (!exp) return;

    document.getElementById('modal-merchant').innerText = exp.merchant;
    document.getElementById('modal-date').innerText = `Date: ${formatDate(exp.date)} • Category: ${exp.category}`;

    const policyAlertsHtml = exp.policyViolations && exp.policyViolations.length > 0
      ? exp.policyViolations.map(v => `
          <div class="alert ${v.severity === 'violation' ? 'alert-danger' : 'alert-warning'}" style="margin-bottom: 8px;">
            <i data-lucide="${v.severity === 'violation' ? 'shield-x' : 'shield-alert'}"></i>
            <div>
              <strong>${v.ruleName}:</strong> ${v.message}
            </div>
          </div>
        `).join('')
      : `<div class="alert alert-success" style="margin-bottom: 8px;"><i data-lucide="check-circle-2"></i> Fully compliant with all corporate spending rules.</div>`;

    const fraudAlertsHtml = exp.fraudRisk && exp.fraudRisk.flags && exp.fraudRisk.flags.length > 0
      ? exp.fraudRisk.flags.map(f => `
          <div class="alert alert-warning" style="margin-bottom: 8px;">
            <i data-lucide="alert-triangle"></i>
            <div><strong>Anomaly Check:</strong> ${f}</div>
          </div>
        `).join('')
      : '';

    const splitsHtml = exp.splitDetails && exp.splitDetails.length > 0
      ? `
        <div style="margin-top: 14px;">
          <h5 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Split Allocations</h5>
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th>Target (${exp.splitDetails[0].allocationType})</th>
                <th>Percentage</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${exp.splitDetails.map(s => `
                <tr>
                  <td><strong>${s.targetName}</strong></td>
                  <td>${s.percentage}%</td>
                  <td class="amount-cell">$${s.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
      : '';

    const receiptHtml = exp.receiptUrl
      ? `
        <div style="margin-top: 16px;">
          <h5 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Attached Receipt File</h5>
          <div style="max-height: 240px; overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); text-align: center; background: #000;">
            <img src="${exp.receiptUrl}" style="max-height: 240px; margin: 0 auto; object-fit: contain;">
          </div>
          <div style="margin-top: 6px; text-align: right;">
            <a href="${exp.receiptUrl}" target="_blank" class="btn btn-secondary btn-sm"><i data-lucide="external-link"></i> Open Full Receipt</a>
          </div>
        </div>
      `
      : '<div style="margin-top: 10px; font-size: 12px; color: var(--text-muted);">No receipt image attached.</div>';

    document.getElementById('modal-body-content').innerHTML = `
      <div class="grid-2" style="margin-bottom: 16px;">
        <div style="background: var(--surface-card-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total Claim Amount</div>
          <div style="font-family: var(--font-heading); font-size: 24px; font-weight: 800; color: var(--brand-primary);">${formatMoney(exp.convertedAmount || exp.amount, exp.reportingCurrency || 'USD')}</div>
          ${exp.currency !== 'USD' ? `<div style="font-size: 12px; color: var(--text-secondary);">Converted from ${exp.amount.toFixed(2)} ${exp.currency} @ ${exp.exchangeRate} rate</div>` : ''}
        </div>
        <div style="background: var(--surface-card-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Lifecycle Status</div>
          <div style="margin-top: 4px;">
            <span class="badge badge-${exp.status === 'approved' ? 'approved' : exp.status === 'reimbursed' ? 'reimbursed' : 'pending'}">${exp.status.toUpperCase()}</span>
          </div>
          ${exp.reimbursementRef ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">Ref: ${exp.reimbursementRef}</div>` : ''}
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <h5 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Business Purpose / Description</h5>
        <p style="font-size: 13.5px; color: var(--text-primary);">${exp.description || 'No description provided.'}</p>
      </div>

      <div style="margin-bottom: 12px;">
        <h5 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Policy & Compliance Audit</h5>
        ${policyAlertsHtml}
        ${fraudAlertsHtml}
      </div>

      ${splitsHtml}
      ${receiptHtml}
    `;

    document.getElementById('expense-modal').classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    showToast('Failed to load expense details: ' + err.message, 'error');
  }
}

function closeModal() {
  const modal = document.getElementById('expense-modal');
  if (modal) modal.classList.remove('active');
}

async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense record?')) return;

  try {
    await api.delete(`/expenses/${id}`);
    showToast('Expense claim deleted successfully.', 'success');
    loadExpenses();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-category').value = 'All';
  document.getElementById('filter-status').value = 'All';
  document.getElementById('filter-policy').value = 'All';
  loadExpenses();
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
