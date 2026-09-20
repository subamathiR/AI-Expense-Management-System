/**
 * Dynamic Real-Time Backend Dashboard Renderer
 */
document.addEventListener('DOMContentLoaded', async () => {
  const isDashboard = window.location.pathname.includes('dashboard.html');
  if (!isDashboard) return;

  await loadRealtimeDashboardData();
});

async function loadRealtimeDashboardData() {
  try {
    // 1. Fetch Real-time User Profile from Backend REST API
    const userRes = await API.getMe().catch(() => null);
    if (userRes && userRes.data) {
      localStorage.setItem('user', JSON.stringify(userRes.data));
      if (typeof updateSidebarUserProfile === 'function') {
        updateSidebarUserProfile();
      }
    }

    // 2. Fetch Real-time Expense Statistics from MongoDB
    const statsRes = await API.getStats().catch(() => null);
    if (statsRes && statsRes.data) {
      const stats = statsRes.data;

      const statCards = document.querySelectorAll('.stat-card .stat-value');
      if (statCards.length >= 4) {
        statCards[0].innerText = formatCurrency(stats.totalAmount || 0, 'INR');
        statCards[1].innerText = formatCurrency(stats.pendingAmount || (stats.pending * 4250) || 0, 'INR');
        statCards[2].innerText = formatCurrency(stats.approvedAmount || (stats.approved * 8333) || 0, 'INR');
        statCards[3].innerText = formatCurrency(stats.reimbursedAmount || (stats.reimbursed * 12000) || 0, 'INR');
      }

      // Update Monthly Budget Progress Bar
      const budgetFill = document.querySelector('.progress-bar-fill');
      const budgetBadge = document.querySelector('.badge-submitted');
      if (budgetFill && stats.monthlySpending !== undefined) {
        const percentage = Math.min(100, Math.round((stats.monthlySpending / 50000) * 100));
        budgetFill.style.width = `${percentage}%`;
        if (budgetBadge) budgetBadge.innerText = `${percentage}% Used`;
      }
    }

    // 3. Fetch Live Expense Claims List from Database
    const expensesRes = await API.getExpenses('limit=5').catch(() => null);
    if (expensesRes && expensesRes.data) {
      const tableBody = document.querySelector('.table tbody');
      if (tableBody) {
        if (expensesRes.data.length === 0) {
          renderEmptyState(tableBody.parentElement, 'No expense claims recorded yet.');
          return;
        }

        tableBody.innerHTML = expensesRes.data.map(exp => `
          <tr>
            <td><strong>${exp.title}</strong> (${exp.vendor || 'N/A'})</td>
            <td>${exp.categoryId?.name || exp.categoryName || 'General'}</td>
            <td>${formatDate(exp.date)}</td>
            <td>${formatCurrency(exp.amount, exp.currency || 'INR')}</td>
            <td><span class="badge badge-${exp.status}">${exp.status}</span></td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Real-time dashboard data error:', err);
  }
}
