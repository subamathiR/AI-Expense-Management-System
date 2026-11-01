/* ===================================================================
   EXPENSEAI — DASHBOARD CONTROLLER SCRIPT
   Fetches real-time analytics, renders Chart.js charts, and fills tables
   =================================================================== */

let trendChartInstance = null;
let categoryChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
  await loadRecentTransactions();
});

async function loadDashboardData() {
  try {
    const res = await api.get('/analytics/dashboard');
    if (!res || !res.success) return;

    const { kpis, categoryBreakdown, monthlyTrend, aiInsight } = res;

    // Update KPI values
    document.getElementById('kpi-total-spend').innerText = formatMoney(kpis.totalMonthSpend);
    document.getElementById('kpi-pending-count').innerText = `${kpis.pendingCount} Claims`;
    document.getElementById('kpi-pending-amount').innerText = `${formatMoney(kpis.pendingAmount)} in review`;
    document.getElementById('kpi-budget-pct').innerText = `${kpis.budgetUtilizationPct}%`;
    document.getElementById('kpi-flagged-count').innerText = `${kpis.flaggedCount} Flags`;

    // Update AI Insight
    if (aiInsight) {
      document.getElementById('ai-insight-text').innerText = aiInsight;
    }

    // Render Charts
    renderMonthlyTrendChart(monthlyTrend || []);
    renderCategoryChart(categoryBreakdown || {});
  } catch (err) {
    console.error('Failed to load dashboard analytics:', err);
  }
}

function renderMonthlyTrendChart(trendData) {
  const ctx = document.getElementById('monthlyTrendChart');
  if (!ctx) return;

  const labels = trendData.map(t => `${t.monthName} ${t.year}`);
  const values = trendData.map(t => t.total);

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [{
        label: 'Monthly Spending ($)',
        data: values.length > 0 ? values : [8200, 9500, 11400, 10200, 12800, 14820],
        borderColor: '#0B3B2C',
        backgroundColor: 'rgba(11, 59, 44, 0.08)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#C29F5D',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#061F17',
          titleFont: { family: 'Plus Jakarta Sans', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          callbacks: {
            label: (item) => ` Amount: $${item.raw.toLocaleString()}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(215, 207, 194, 0.4)' },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#73847E',
            callback: (val) => `$${val}`,
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: '#73847E',
          },
        },
      },
    },
  });
}

function renderCategoryChart(categoryMap) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  let labels = Object.keys(categoryMap);
  let data = Object.values(categoryMap);

  if (labels.length === 0) {
    labels = ['Travel', 'Meals & Entertainment', 'Office Supplies', 'Software'];
    data = [4200, 1850, 980, 2400];
  }

  const palette = [
    '#0B3B2C', // Deep Forest Green
    '#53796A', // Sage
    '#C29F5D', // Gold
    '#769B8D', // Mint
    '#D97706', // Amber
    '#2563EB', // Blue
    '#7C3AED', // Purple
  ];

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: palette.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => ` ${item.label}: $${item.raw.toLocaleString()}`,
          },
        },
      },
    },
  });

  // Render HTML custom legend
  const legendContainer = document.getElementById('category-legend');
  if (legendContainer) {
    const total = data.reduce((a, b) => a + b, 0) || 1;
    legendContainer.innerHTML = labels.slice(0, 4).map((label, idx) => {
      const val = data[idx];
      const pct = Math.round((val / total) * 100);
      return `
        <div class="legend-item">
          <div class="flex items-center">
            <span class="legend-color-dot" style="background-color: ${palette[idx]};"></span>
            <span>${label}</span>
          </div>
          <span style="font-weight: 700;">$${val.toFixed(2)} (${pct}%)</span>
        </div>
      `;
    }).join('');
  }
}

async function loadRecentTransactions() {
  const tbody = document.getElementById('recent-expenses-tbody');
  if (!tbody) return;

  try {
    const res = await api.get('/expenses');
    if (!res || !res.data || res.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">
            No expense records found. Click <strong>Add Expense</strong> to create your first claim.
          </td>
        </tr>
      `;
      return;
    }

    const expenses = res.data.slice(0, 7);
    tbody.innerHTML = expenses.map(exp => {
      const policyBadgeClass =
        exp.policyStatus === 'within_policy' ? 'badge-within-policy' :
        exp.policyStatus === 'requires_review' ? 'badge-requires-review' : 'badge-violation';

      const statusBadgeClass =
        exp.status === 'approved' ? 'badge-approved' :
        exp.status === 'reimbursed' ? 'badge-reimbursed' :
        exp.status === 'rejected' ? 'badge-rejected' : 'badge-pending';

      const submitterName = exp.userId ? exp.userId.name : 'Employee';

      return `
        <tr>
          <td style="color: var(--text-secondary);">${formatDate(exp.date)}</td>
          <td>
            <strong>${exp.merchant}</strong>
            ${exp.receiptUrl ? '<i data-lucide="paperclip" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-left: 4px; color: var(--brand-primary);"></i>' : ''}
          </td>
          <td><span class="category-tag">${exp.category}</span></td>
          <td style="font-size: 13px; color: var(--text-secondary);">${submitterName}</td>
          <td><span class="badge ${policyBadgeClass}">${exp.policyStatus.replace('_', ' ')}</span></td>
          <td><span class="badge ${statusBadgeClass}">${exp.status.replace('_', ' ')}</span></td>
          <td class="amount-cell">${formatMoney(exp.convertedAmount || exp.amount, exp.reportingCurrency || exp.currency)}</td>
          <td style="text-align: center;">
            <a href="expenses.html?id=${exp._id}" class="btn btn-ghost btn-sm" title="View Details">
              <i data-lucide="eye"></i>
            </a>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: #DC2626; padding: 20px;">
          Failed to load transactions: ${err.message}
        </td>
      </tr>
    `;
  }
}
