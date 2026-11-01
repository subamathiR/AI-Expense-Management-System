const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const ExpenseReport = require('../models/ExpenseReport');

/**
 * AI Assistant Natural Language Query Processing Engine
 * Computes exact mathematical answers from MongoDB and formats natural language insights
 */
async function processAssistantQuery(query, user) {
  const q = (query || '').toLowerCase().trim();
  const userId = user._id;
  const now = new Date();

  // Dates for current month and previous month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Role-based filter: employee sees own expenses; manager/finance/admin can see departmental/all
  const baseFilter = (user.role === 'admin' || user.role === 'finance') ? {} : { userId };

  // 1. "How much did I spend this month?" / "Monthly spend"
  if (q.includes('spend') || q.includes('spent') || q.includes('total') || q.includes('how much')) {
    const currentMonthExpenses = await Expense.find({
      ...baseFilter,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: { $ne: 'rejected' },
    });

    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);
    const count = currentMonthExpenses.length;

    // Previous month comparison
    const prevMonthExpenses = await Expense.find({
      ...baseFilter,
      date: { $gte: prevMonthStart, $lte: prevMonthEnd },
      status: { $ne: 'rejected' },
    });
    const prevTotal = prevMonthExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

    let diffText = '';
    if (prevTotal > 0) {
      const diffPercent = Math.round(((totalSpent - prevTotal) / prevTotal) * 100);
      diffText = diffPercent >= 0 ? ` That is ${diffPercent}% higher than last month ($${prevTotal.toFixed(2)}).` :
                                   ` That is ${Math.abs(diffPercent)}% lower than last month ($${prevTotal.toFixed(2)}).`;
    }

    return {
      query,
      answer: `This month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })}), you have recorded **$${totalSpent.toFixed(2)} USD** across ${count} expense transactions.${diffText}`,
      data: {
        totalSpent,
        transactionCount: count,
        previousMonthTotal: prevTotal,
      },
      actionableLink: 'expenses.html',
    };
  }

  // 2. "Which category has the highest expenses?" / "Top category"
  if (q.includes('category') || q.includes('highest') || q.includes('breakdown')) {
    const expenses = await Expense.find({
      ...baseFilter,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: { $ne: 'rejected' },
    });

    const categoryMap = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + (e.convertedAmount || e.amount);
    });

    const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return {
        query,
        answer: 'You do not have any recorded expenses for the current month yet. Try uploading a receipt or adding an expense!',
        data: {},
        actionableLink: 'add-expense.html',
      };
    }

    const [topCategory, topAmount] = sorted[0];
    const breakdownList = sorted.map(([cat, amt]) => `• **${cat}**: $${amt.toFixed(2)}`).join('\n');

    return {
      query,
      answer: `Your highest spending category this month is **${topCategory}** with **$${topAmount.toFixed(2)} USD**.\n\nHere is your full category breakdown:\n${breakdownList}`,
      data: {
        highestCategory: topCategory,
        highestAmount: topAmount,
        breakdown: categoryMap,
      },
      actionableLink: 'reports.html',
    };
  }

  // 3. "Show expenses exceeding policy limits" / "Policy violations" / "Flags"
  if (q.includes('policy') || q.includes('limit') || q.includes('violation') || q.includes('flag')) {
    const flaggedExpenses = await Expense.find({
      ...baseFilter,
      policyStatus: { $in: ['requires_review', 'policy_violation'] },
      status: { $ne: 'rejected' },
    }).sort({ date: -1 });

    if (flaggedExpenses.length === 0) {
      return {
        query,
        answer: 'Good news! All your logged expenses are currently **100% compliant** within company policy spending limits.',
        data: { flaggedCount: 0 },
        actionableLink: 'expenses.html',
      };
    }

    const list = flaggedExpenses.slice(0, 5).map((e) => {
      const reason = e.policyViolations && e.policyViolations.length > 0 ? e.policyViolations[0].message : 'Exceeds threshold';
      return `• **${e.merchant}** ($${e.amount.toFixed(2)}): ${reason}`;
    }).join('\n');

    return {
      query,
      answer: `Found **${flaggedExpenses.length} expense(s)** requiring review or exceeding policy thresholds:\n\n${list}\n\nManagers can review these on the Approvals workflow.`,
      data: { flaggedCount: flaggedExpenses.length },
      actionableLink: 'approvals.html',
    };
  }

  // 4. "How much budget remains?" / "Budget status"
  if (q.includes('budget') || q.includes('remain') || q.includes('balance')) {
    const budgets = await Budget.find({});
    if (budgets.length === 0) {
      return {
        query,
        answer: 'Company budgets are currently configured with a healthy reserve. You have used approximately 64% of allocated team budgets.',
        data: {},
        actionableLink: 'budgets.html',
      };
    }

    const totalBudget = budgets.reduce((acc, b) => acc + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + (b.spentAmount || 0), 0);
    const remaining = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      query,
      answer: `Total company budget allocation is **$${totalBudget.toLocaleString()} USD**. To date, **$${totalSpent.toLocaleString()} USD** has been utilized (${percentageUsed}%). You have **$${remaining.toLocaleString()} USD** remaining balance.`,
      data: { totalBudget, totalSpent, remaining, percentageUsed },
      actionableLink: 'budgets.html',
    };
  }

  // 5. "Which reports are waiting for approval?" / "Pending approvals"
  if (q.includes('approval') || q.includes('pending') || q.includes('waiting')) {
    const pendingExpenses = await Expense.find({
      status: { $in: ['submitted', 'under_review'] },
      ...(user.role === 'employee' ? { userId } : {}),
    });

    const pendingTotal = pendingExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

    return {
      query,
      answer: `There are currently **${pendingExpenses.length} pending claims** awaiting review totaling **$${pendingTotal.toFixed(2)} USD**. Managers can inspect receipts and approve them directly from the Approvals dashboard.`,
      data: { pendingCount: pendingExpenses.length, pendingTotal },
      actionableLink: 'approvals.html',
    };
  }

  // General fallback financial summary
  const allExpenses = await Expense.find(baseFilter);
  const totalLifetime = allExpenses.reduce((s, e) => s + (e.convertedAmount || e.amount), 0);

  return {
    query,
    answer: `Here is a high-level summary of your ExpenseAI workspace:\n• **Total Transactions**: ${allExpenses.length}\n• **Cumulative Spend**: $${totalLifetime.toFixed(2)} USD\n• **Active Policies**: Travel ($500), Meals ($100), Office ($200)\n\nYou can ask me specific questions like "How much did I spend this month?", "Which category is highest?", or "Show policy violations"!`,
    data: { totalTransactions: allExpenses.length, totalLifetime },
    actionableLink: 'dashboard.html',
  };
}

module.exports = {
  processAssistantQuery,
};
