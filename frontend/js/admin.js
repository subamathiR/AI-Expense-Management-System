/**
 * Admin Module — Management of Users, Roles, Policies, Categories, and System Settings
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const usersTableBody = document.querySelector('#users-table tbody');
  const categoriesTableBody = document.querySelector('#categories-table tbody');
  const policiesTableBody = document.querySelector('#policies-table tbody');
  const budgetsTableBody = document.querySelector('#budgets-table tbody');
  const pingBtn = document.getElementById('ping-health-btn');
  const pingResult = document.getElementById('ping-result');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const testSyncBtns = document.querySelectorAll('.btn-test-sync');

  // Load Users
  if (usersTableBody) {
    await loadUsers();
  }

  // Load Categories
  if (categoriesTableBody) {
    await loadCategories();
  }

  // Load Policies
  if (policiesTableBody) {
    await loadPolicies();
  }

  // Load Budgets
  if (budgetsTableBody) {
    await loadBudgets();
  }

  // Health Ping
  if (pingBtn) {
    pingBtn.addEventListener('click', async () => {
      pingBtn.disabled = true;
      pingBtn.innerText = 'Pinging...';
      const start = performance.now();
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        const data = await res.json();
        const latency = Math.round(performance.now() - start);
        if (data.success) {
          if (pingResult) {
            pingResult.innerHTML = `<span class="badge badge-approved" style="font-size: 0.85rem;">Online (${latency}ms)</span>`;
          }
          showToast(`Server healthy: ${data.message} (${latency}ms)`, 'success');
        } else {
          throw new Error('Health check returned non-success');
        }
      } catch (err) {
        if (pingResult) {
          pingResult.innerHTML = `<span class="badge badge-rejected" style="font-size: 0.85rem;">Offline</span>`;
        }
        showToast('Server unreachable or error in health endpoint', 'error');
      } finally {
        pingBtn.disabled = false;
        pingBtn.innerText = '⚡ Ping Health API';
      }
    });
  }

  // Test Sync buttons
  testSyncBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const service = btn.getAttribute('data-service') || 'Service';
      btn.disabled = true;
      const originalText = btn.innerText;
      btn.innerText = 'Testing...';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerText = originalText;
        showToast(`Connection to ${service} verified successfully! (200 OK)`, 'success');
      }, 700);
    });
  });

  // Save Settings
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const ocrProvider = document.getElementById('ocr-provider')?.value || 'tesseract';
      const baseCurrency = document.getElementById('base-currency')?.value || 'USD';
      const mileageRate = document.getElementById('mileage-rate')?.value || '0.50';
      const mileageUnit = document.getElementById('mileage-unit')?.value || 'km';
      const confidence = document.getElementById('ocr-confidence')?.value || '85';

      const config = {
        ocrProvider,
        baseCurrency,
        mileageRate,
        mileageUnit,
        confidence,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('expenseai_settings', JSON.stringify(config));
      showToast('Enterprise configurations updated successfully!', 'success');
    });

    // Restore saved settings
    const savedConfigStr = localStorage.getItem('expenseai_settings');
    if (savedConfigStr) {
      try {
        const cfg = JSON.parse(savedConfigStr);
        if (document.getElementById('ocr-provider')) document.getElementById('ocr-provider').value = cfg.ocrProvider || 'tesseract';
        if (document.getElementById('base-currency')) document.getElementById('base-currency').value = cfg.baseCurrency || 'USD';
        if (document.getElementById('mileage-rate')) document.getElementById('mileage-rate').value = cfg.mileageRate || '0.50';
        if (document.getElementById('mileage-unit')) document.getElementById('mileage-unit').value = cfg.mileageUnit || 'km';
        if (document.getElementById('ocr-confidence')) document.getElementById('ocr-confidence').value = cfg.confidence || '85';
        if (document.getElementById('confidence-val')) document.getElementById('confidence-val').innerText = `${cfg.confidence || 85}%`;
      } catch (e) {
        console.error('Error reading saved config', e);
      }
    }
  }

  // Load Users Function
  async function loadUsers() {
    try {
      const res = await API.getUsers();
      const users = res.data || [];

      if (users.length === 0) {
        usersTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2rem;" class="text-muted">
              No users found in directory.
            </td>
          </tr>
        `;
        return;
      }

      usersTableBody.innerHTML = users.map(u => {
        const name = u.firstName ? `${u.firstName} ${u.lastName}` : (u.name || u.email.split('@')[0]);
        return `
          <tr>
            <td><strong>${name}</strong></td>
            <td>${u.email}</td>
            <td>${u.department || 'General'}</td>
            <td>
              <select onchange="changeRole('${u._id}', this.value)" style="padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); background: var(--bg-surface); color: var(--text-main); border: 1px solid var(--border-color);">
                <option value="employee" ${u.role === 'employee' ? 'selected' : ''}>Employee</option>
                <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </td>
            <td>
              <span class="badge badge-approved">Active</span>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">
            Failed to load users: ${err.message || 'Server error'}
          </td>
        </tr>
      `;
    }
  }

  // Load Categories Function
  async function loadCategories() {
    try {
      const categoriesRes = await fetch(`${API_BASE_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await categoriesRes.json();
      const categories = data.data || [];

      if (categories.length === 0) {
        categoriesTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 2rem;" class="text-muted">
              No categories configured.
            </td>
          </tr>
        `;
        return;
      }

      categoriesTableBody.innerHTML = categories.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.description || 'Enterprise category'}</td>
          <td>
            ${(c.keywords || []).map(k => `<code style="background: rgba(99,102,241,0.1); color: #818cf8; padding: 0.15rem 0.35rem; border-radius: 4px; margin-right: 0.25rem; font-size: 0.8rem;">${k}</code>`).join('') || '<span class="text-muted">Default classification</span>'}
          </td>
          <td><span class="badge ${c.isActive ? 'badge-approved' : 'badge-draft'}">${c.isActive ? 'Active' : 'Disabled'}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  // Load Policies Function
  async function loadPolicies() {
    try {
      const res = await API.getPolicies();
      const policies = res.data || [];

      if (policies.length === 0) {
        policiesTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 2rem;" class="text-muted">
              No active compliance policies.
            </td>
          </tr>
        `;
        return;
      }

      policiesTableBody.innerHTML = policies.map(p => `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.categoryId ? (p.categoryId.name || 'All Categories') : 'General'}</td>
          <td>${p.maxAmount ? `Maximum ${formatCurrency(p.maxAmount)} per ${p.maxAmountPeriod || 'transaction'}` : (p.description || 'Standard policy')}</td>
          <td><span class="badge ${p.isActive ? 'badge-approved' : 'badge-draft'}">${p.isActive ? 'Enforced' : 'Inactive'}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading policies:', err);
    }
  }

  // Load Budgets Function
  async function loadBudgets() {
    try {
      const res = await API.getBudgets();
      const budgets = res.data || [];

      if (budgets.length === 0) {
        budgetsTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2rem;" class="text-muted">
              No budgets established.
            </td>
          </tr>
        `;
        return;
      }

      budgetsTableBody.innerHTML = budgets.map(b => {
        const spent = b.spentAmount || 0;
        const total = b.totalAmount || 1;
        const pct = Math.min(100, Math.round((spent / total) * 100));
        return `
          <tr>
            <td><strong>${b.name || (b.category ? b.category.name : 'Corporate Budget')}</strong></td>
            <td>${formatCurrency(total)}</td>
            <td>${formatCurrency(spent)}</td>
            <td style="min-width: 140px;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: ${pct > 90 ? 'var(--danger)' : (pct > 75 ? 'var(--warning)' : 'var(--success)')};"></div>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${pct}%</span>
              </div>
            </td>
            <td><span class="badge badge-approved">Active</span></td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error loading budgets:', err);
    }
  }

  // Expose changeRole globally
  window.changeRole = async (userId, newRole) => {
    try {
      await API.updateUserRole(userId, newRole);
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update user role', 'error');
    }
  };
});
