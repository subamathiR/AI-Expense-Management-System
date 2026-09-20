/**
 * Budget Module — Manages budget utilization, progress bars, and alerts
 */
document.addEventListener('DOMContentLoaded', async () => {
  const budgetContainer = document.getElementById('budget-cards-container');

  if (budgetContainer) {
    try {
      const res = await API.getBudgets();
      const budgets = res.data || [];

      if (budgets.length === 0) {
        budgetContainer.innerHTML = `<p class="text-muted">No budgets currently configured.</p>`;
        return;
      }

      budgetContainer.innerHTML = budgets.map(b => {
        const percent = Math.min(100, Math.round((b.spentAmount / b.totalAmount) * 100)) || 0;
        let badgeClass = 'badge-approved';
        let barClass = 'success';
        if (percent >= 90) {
          badgeClass = 'badge-rejected';
          barClass = 'danger';
        } else if (percent >= 70) {
          badgeClass = 'badge-violation';
          barClass = 'warning';
        }

        return `
          <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-header">
              <h3>${formatText(b.category || b.name)} Budget</h3>
              <span class="badge ${badgeClass}">${percent}% Used</span>
            </div>
            <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">
              Spent <strong>${formatCurrency(b.spentAmount)}</strong> of <strong>${formatCurrency(b.totalAmount)}</strong>
            </p>
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${barClass}" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      budgetContainer.innerHTML = `<p style="color: var(--danger);">Failed to load budget data.</p>`;
    }
  }
});
