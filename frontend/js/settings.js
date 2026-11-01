/* ===================================================================
   EXPENSEAI — SETTINGS & POLICY MANAGEMENT CONTROLLER SCRIPT
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  loadPolicies();
});

async function loadUserProfile() {
  const user = api.getUser();
  if (!user) return;

  document.getElementById('profile-name').value = user.name || '';
  document.getElementById('profile-email').value = user.email || '';
  document.getElementById('profile-dept').value = user.department || 'Engineering';
  document.getElementById('profile-currency').value = user.preferredCurrency || 'USD';
  document.getElementById('security-role-pill').innerText = user.role.toUpperCase();

  // Role capabilities description
  const capList = document.getElementById('role-capabilities-list');
  if (user.role === 'admin') {
    capList.innerHTML = `
      <li>Configure global corporate spending limits & approval workflows</li>
      <li>Manage company user roles and departmental privileges</li>
      <li>Full access to enterprise-wide financial audit logs and integrations</li>
      <li>Approve, reject, or re-route any submitted expense claims</li>
    `;
  } else if (user.role === 'finance') {
    capList.innerHTML = `
      <li>Review manager-approved expense claims in reimbursement queue</li>
      <li>Disburse ACH / ERP settlement batches with transaction references</li>
      <li>Export financial audit statements and tax summaries (CSV/PDF)</li>
      <li>Inspect flagged anomalies and policy exception overrides</li>
    `;
  } else if (user.role === 'manager') {
    capList.innerHTML = `
      <li>Review assigned pending claims from team employees</li>
      <li>Inspect uploaded receipts, AI OCR fields, and policy alerts</li>
      <li>Approve claims or reject with documented explanations</li>
      <li>Track departmental budget headroom in real time</li>
    `;
  }
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('profile-name').value.trim();
  const department = document.getElementById('profile-dept').value.trim();
  const preferredCurrency = document.getElementById('profile-currency').value;

  const btn = document.getElementById('save-profile-btn');
  btn.disabled = true;

  try {
    const res = await api.put('/auth/profile', { name, department, preferredCurrency });
    api.setUser(res.user);
    showToast('Profile information and currency updated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

async function loadPolicies() {
  const tbody = document.getElementById('policies-table-tbody');
  if (!tbody) return;

  try {
    const res = await api.get('/policies');
    const policies = res.data || [];

    if (policies.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">
            No custom policies found. Default system ceilings active.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = policies.map(p => `
      <tr>
        <td><strong>${p.category}</strong></td>
        <td><strong>$${p.maxAmountPerExpense.toFixed(2)}</strong></td>
        <td>$${p.dailyLimit.toFixed(2)}</td>
        <td>$${p.requiresReceiptAbove.toFixed(2)}</td>
        <td>$${p.managerApprovalThreshold.toFixed(2)}</td>
        <td>
          <span class="badge ${p.isActive ? 'badge-approved' : 'badge-draft'}">
            ${p.isActive ? 'ENFORCED' : 'INACTIVE'}
          </span>
        </td>
        <td style="text-align: center;">
          <label class="switch">
            <input type="checkbox" ${p.isActive ? 'checked' : ''} onchange="togglePolicy('${p._id}', this.checked)">
            <span class="switch-slider"></span>
          </label>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #DC2626; padding: 20px;">
          Failed to load policies: ${err.message}
        </td>
      </tr>
    `;
  }
}

async function togglePolicy(id, isActive) {
  try {
    await api.put(`/policies/${id}`, { isActive });
    showToast(`Policy enforcement ${isActive ? 'enabled' : 'disabled'}.`, 'success');
    loadPolicies();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
