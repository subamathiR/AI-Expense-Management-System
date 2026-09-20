const Budget = require('../models/Budget');

/**
 * @desc    Get all active budgets
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ isActive: true }).populate('categoryId');
    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new budget
 * @route   POST /api/budgets
 * @access  Private/Admin
 */
const createBudget = async (req, res, next) => {
  try {
    const { name, categoryId, department, totalAmount, period, warningThresholds } = req.body;

    const budget = await Budget.create({
      name,
      categoryId: categoryId || null,
      department: department || '',
      totalAmount,
      spentAmount: 0,
      period,
      warningThresholds: warningThresholds || [70, 80, 90, 100],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a budget
 * @route   PUT /api/budgets/:id
 * @access  Private/Admin
 */
const updateBudget = async (req, res, next) => {
  try {
    const { name, categoryId, department, totalAmount, spentAmount, period, warningThresholds, isActive } = req.body;

    let budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    if (name !== undefined) budget.name = name;
    if (categoryId !== undefined) budget.categoryId = categoryId || null;
    if (department !== undefined) budget.department = department;
    if (totalAmount !== undefined) budget.totalAmount = totalAmount;
    if (spentAmount !== undefined) budget.spentAmount = spentAmount;
    if (period !== undefined) budget.period = period;
    if (warningThresholds !== undefined) budget.warningThresholds = warningThresholds;
    if (isActive !== undefined) budget.isActive = isActive;

    await budget.save();

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get budget usage analytics
 * @route   GET /api/budgets/usage
 * @access  Private
 */
const getBudgetUsage = async (req, res, next) => {
  try {
    // Return active budgets with virtuals (percentageUsed, remainingAmount)
    const budgets = await Budget.find({ isActive: true }).populate('categoryId');
    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  getBudgetUsage,
};
