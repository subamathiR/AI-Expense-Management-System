/**
 * Expenses Module — Handles expense listing, creation, updates, and details
 */
document.addEventListener('DOMContentLoaded', async () => {
  const expenseTableBody = document.querySelector('#expense-table tbody');
  const searchInput = document.getElementById('search-expense');
  const categoryFilter = document.getElementById('filter-category');
  const statusFilter = document.getElementById('filter-status');
  const createExpenseForm = document.getElementById('create-expense-form');

  // Load Expenses if table exists
  if (expenseTableBody) {
    await renderExpenses();

    if (searchInput) searchInput.addEventListener('input', renderExpenses);
    if (categoryFilter) categoryFilter.addEventListener('change', renderExpenses);
    if (statusFilter) statusFilter.addEventListener('change', renderExpenses);
  }

  // Handle Add Expense Form Submit
  if (createExpenseForm) {
    createExpenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vendor = document.getElementById('vendor')?.value;
      const amount = parseFloat(document.getElementById('amount')?.value || '0');
      const category = document.getElementById('category')?.value;
      const date = document.getElementById('date')?.value;
      const description = document.getElementById('description')?.value;
      const currency = document.getElementById('currency')?.value || 'USD';

      try {
        await API.createExpense({
          title: vendor ? `${vendor} Expense` : 'Expense Claim',
          vendor,
          amount,
          category,
          date,
          description,
          currency,
          status: 'submitted'
        });
        showToast('Expense created and submitted successfully!', 'success');
        setTimeout(() => {
          window.location.href = './expenses.html';
        }, 800);
      } catch (err) {
        showToast(err.message || 'Failed to create expense', 'error');
      }
    });
  }

  async function renderExpenses() {
    try {
      const res = await API.getExpenses();
      let expenses = res.data || [];

      // Filter by search
      if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase();
        expenses = expenses.filter(exp =>
          exp.vendor?.toLowerCase().includes(query) ||
          exp.category?.toLowerCase().includes(query) ||
          exp.description?.toLowerCase().includes(query)
        );
      }

      // Filter by category
      if (categoryFilter && categoryFilter.value) {
        expenses = expenses.filter(exp => exp.category === categoryFilter.value);
      }

      // Filter by status
      if (statusFilter && statusFilter.value) {
        expenses = expenses.filter(exp => exp.status === statusFilter.value);
      }

      if (expenses.length === 0) {
        expenseTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;" class="text-muted">
              No expenses found.
            </td>
          </tr>
        `;
        return;
      }

      expenseTableBody.innerHTML = expenses.map(exp => `
        <tr>
          <td><strong>${formatText(exp.vendor)}</strong></td>
          <td>${formatText(exp.category)}</td>
          <td>${formatDate(exp.date)}</td>
          <td>${formatCurrency(exp.amount, exp.currency || 'INR')}</td>
          <td><span class="badge badge-${(exp.status || 'draft').toLowerCase()}">${exp.status}</span></td>
          <td>
            <a href="./expense-details.html?id=${exp._id}" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">View</a>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      if (expenseTableBody) {
        expenseTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--danger); padding: 1.5rem;">
              Failed to load expenses. ${err.message || ''}
            </td>
          </tr>
        `;
      }
    }
  }
});
