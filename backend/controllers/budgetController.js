const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc    Get all budgets with dynamic actual spend calculation
// @route   GET /api/budgets
exports.getBudgets = async (req, res, next) => {
  try {
    const { department, fiscalYear, month } = req.query;
    const filter = {};
    if (department && department !== 'All') filter.department = department;
    if (fiscalYear) filter.fiscalYear = parseInt(fiscalYear);
    if (month && month !== 'All') filter.month = parseInt(month);

    const budgets = await Budget.find(filter).sort({ department: 1, category: 1 });

    // Calculate actual spending dynamically from Expense collection
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Aggregate expenses by category
    const expenseAgg = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $ne: 'rejected' },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: { $ifNull: ['$convertedAmount', '$amount'] } },
        },
      },
    ]);

    const spentMap = {};
    expenseAgg.forEach((item) => {
      spentMap[item._id] = item.totalSpent;
    });

    const enrichedBudgets = budgets.map((b) => {
      const actualSpent = spentMap[b.category] || 0;
      const remaining = Math.max(0, b.budgetAmount - actualSpent);
      const percentUtilized = b.budgetAmount > 0 ? Math.round((actualSpent / b.budgetAmount) * 100) : 0;
      const isAlert = percentUtilized >= (b.alertThreshold || 80);

      let alertMessage = null;
      if (isAlert) {
        alertMessage = `You have used ${percentUtilized}% of your ${b.category} budget ($${actualSpent.toFixed(2)} of $${b.budgetAmount.toFixed(2)}).`;
      }

      return {
        _id: b._id,
        department: b.department,
        category: b.category,
        period: b.period,
        fiscalYear: b.fiscalYear,
        month: b.month,
        budgetAmount: b.budgetAmount,
        spentAmount: actualSpent,
        remainingAmount: remaining,
        percentUtilized,
        alertThreshold: b.alertThreshold,
        isAlert,
        alertMessage,
        notes: b.notes,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedBudgets.length,
      data: enrichedBudgets,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update budget
// @route   POST /api/budgets
exports.createOrUpdateBudget = async (req, res, next) => {
  try {
    const { department, category, budgetAmount, alertThreshold, notes, fiscalYear, month } = req.body;

    const yearVal = fiscalYear ? parseInt(fiscalYear) : new Date().getFullYear();
    const monthVal = month ? parseInt(month) : new Date().getMonth() + 1;

    let budget = await Budget.findOne({
      department,
      category,
      fiscalYear: yearVal,
      month: monthVal,
    });

    if (budget) {
      budget.budgetAmount = parseFloat(budgetAmount);
      if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
      if (notes !== undefined) budget.notes = notes;
      await budget.save();
      return res.status(200).json({ success: true, message: 'Budget updated', data: budget });
    }

    budget = await Budget.create({
      department: department || 'General',
      category,
      budgetAmount: parseFloat(budgetAmount),
      alertThreshold: alertThreshold || 80,
      notes: notes || '',
      fiscalYear: yearVal,
      month: monthVal,
    });

    res.status(201).json({ success: true, message: 'Budget created', data: budget });
  } catch (err) {
    next(err);
  }
};
