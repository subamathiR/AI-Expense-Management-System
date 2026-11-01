/* ===================================================================
   EXPENSEAI — BUDGET MANAGEMENT CONTROLLER SCRIPT
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  loadBudgets();
});

async function loadBudgets() {
  const container = document.getElementById('budgets-container');
  if (!container) return;

  const dept = document.getElementById('budget-dept-filter').value;
  const params = new URLSearchParams();
  if (dept && dept !== 'All') params.append('department', dept);

  try {
    const res = await api.get(`/budgets?${params.toString()}`);
    const budgets = res.data || [];

    if (budgets.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          No budgets configured for this selection. Click <strong>Set New Budget</strong> to define limits.
        </div>
      `;
      return;
    }

    container.innerHTML = budgets.map(b => {
      const isOver = b.percentUtilized >= 100;
      const isWarn = b.percentUtilized >= (b.alertThreshold || 80);

      const fillClass = isOver ? 'danger' : isWarn ? 'warning' : '';

      return `
        <div class="card card-interactive">
          <div class="card-header">
            <div>
              <div class="card-title">${b.category}</div>
              <div class="card-subtitle">${b.department} • Monthly Allocation</div>
            </div>
            <span class="category-tag">${b.percentUtilized}% Utilized</span>
          </div>

          <div class="card-body">
            <div class="flex justify-between items-center" style="margin-bottom: 8px;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Actual Spent</div>
                <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--text-primary);">${formatMoney(b.spentAmount)}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total Cap</div>
                <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 800; color: var(--brand-primary);">${formatMoney(b.budgetAmount)}</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar-bg" style="margin: 12px 0;">
              <div class="progress-bar-fill ${fillClass}" style="width: ${Math.min(100, b.percentUtilized)}%;"></div>
            </div>

            <div class="flex justify-between items-center" style="font-size: 12px; color: var(--text-secondary);">
              <span>Remaining: <strong>${formatMoney(b.remainingAmount)}</strong></span>
              <span>Threshold: ${b.alertThreshold}%</span>
            </div>

            ${b.isAlert ? `
              <div class="alert ${isOver ? 'alert-danger' : 'alert-warning'}" style="margin-top: 14px; margin-bottom: 0; padding: 8px 12px; font-size: 12px;">
                <i data-lucide="${isOver ? 'alert-triangle' : 'info'}"></i>
                <div>${b.alertMessage}</div>
              </div>
            ` : ''}

            ${b.notes ? `<div style="margin-top: 10px; font-size: 11.5px; color: var(--text-muted);">${b.notes}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #DC2626; padding: 30px;">
        Failed to load budgets: ${err.message}
      </div>
    `;
  }
}

function openBudgetModal() {
  document.getElementById('budget-modal').classList.add('active');
}

function closeBudgetModal() {
  document.getElementById('budget-modal').classList.remove('active');
}

document.getElementById('budget-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const department = document.getElementById('modal-dept').value;
  const category = document.getElementById('modal-category').value;
  const budgetAmount = parseFloat(document.getElementById('modal-amount').value);
  const alertThreshold = parseFloat(document.getElementById('modal-threshold').value);
  const notes = document.getElementById('modal-notes').value.trim();

  const btn = document.getElementById('save-budget-btn');
  btn.disabled = true;

  try {
    await api.post('/budgets', {
      department,
      category,
      budgetAmount,
      alertThreshold,
      notes,
    });

    showToast('Budget configured successfully!', 'success');
    closeBudgetModal();
    loadBudgets();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});
