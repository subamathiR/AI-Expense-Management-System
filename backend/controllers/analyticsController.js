const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// @desc    Get dashboard analytics and KPI metrics
// @route   GET /api/analytics/dashboard
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const filter = userRole === 'employee' ? { userId: req.user._id } : {};

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    // 1. Total expenses (Current Month)
    const monthExpenses = await Expense.find({
      ...filter,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $ne: 'rejected' },
    });

    const totalMonthSpend = monthExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

    // 2. Pending Approvals
    const pendingExpenses = await Expense.find({
      ...filter,
      status: { $in: ['submitted', 'under_review'] },
    });
    const pendingCount = pendingExpenses.length;
    const pendingAmount = pendingExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

    // 3. Approved Expenses
    const approvedExpenses = await Expense.find({
      ...filter,
      status: 'approved',
    });
    const approvedCount = approvedExpenses.length;
    const approvedAmount = approvedExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

    // 4. Reimbursement Pending & Reimbursed
    const reimbursedExpenses = await Expense.find({
      ...filter,
      status: 'reimbursed',
    });
    const reimbursedAmount = reimbursedExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

    // 5. Flagged Policy Violations
    const flaggedExpenses = await Expense.find({
      ...filter,
      policyStatus: { $in: ['requires_review', 'policy_violation'] },
      status: { $ne: 'rejected' },
    });
    const flaggedCount = flaggedExpenses.length;

    // 6. Category Breakdown (Doughnut Chart Data)
    const categoryTotals = {};
    monthExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (e.convertedAmount || e.amount);
    });

    // 7. Monthly Trend (Last 6 Months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const expList = await Expense.find({
        ...filter,
        date: { $gte: mStart, $lte: mEnd },
        status: { $ne: 'rejected' },
      });

      const total = expList.reduce((s, e) => s + (e.convertedAmount || e.amount), 0);
      monthlyTrend.push({
        monthName: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        total: Math.round(total * 100) / 100,
        count: expList.length,
      });
    }

    // 8. Overall Budget Utilization
    const allBudgets = await Budget.find({});
    const totalBudgetAllocated = allBudgets.reduce((acc, b) => acc + b.budgetAmount, 0) || 50000;
    const budgetUtilizationPct = totalBudgetAllocated > 0 ? Math.min(100, Math.round((totalMonthSpend / totalBudgetAllocated) * 100)) : 0;

    // 9. AI Insights Summary
    let aiInsightText = 'All corporate expense streams are functioning within expected financial thresholds.';
    if (flaggedCount > 0) {
      aiInsightText = `Attention: ${flaggedCount} transaction(s) currently exceed policy spending thresholds or require review.`;
    } else if (budgetUtilizationPct > 75) {
      aiInsightText = `Notice: Monthly budget utilization has reached ${budgetUtilizationPct}%. Moderate non-essential departmental spend.`;
    } else if (totalMonthSpend > 0) {
      const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
      if (topCat) {
        aiInsightText = `Smart Insight: Your highest expense concentration this month is in ${topCat[0]} ($${topCat[1].toFixed(2)}).`;
      }
    }

    res.status(200).json({
      success: true,
      kpis: {
        totalMonthSpend: Math.round(totalMonthSpend * 100) / 100,
        pendingCount,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        approvedCount,
        approvedAmount: Math.round(approvedAmount * 100) / 100,
        reimbursedAmount: Math.round(reimbursedAmount * 100) / 100,
        flaggedCount,
        budgetUtilizationPct,
        totalBudgetAllocated,
      },
      categoryBreakdown: categoryTotals,
      monthlyTrend,
      aiInsight: aiInsightText,
    });
  } catch (err) {
    next(err);
  }
};
