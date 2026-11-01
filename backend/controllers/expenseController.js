const Expense = require('../models/Expense');
const Receipt = require('../models/Receipt');
const { evaluateExpensePolicy } = require('../services/policyService');
const { assessAnomalyRisk } = require('../services/fraudService');
const { convertCurrency } = require('../services/currencyService');

// @desc    Get expenses with filtering and pagination
// @route   GET /api/expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const { category, status, policyStatus, startDate, endDate, search } = req.query;

    const query = {};

    // Role-based scoping: employee only sees own expenses
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    }

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (policyStatus && policyStatus !== 'All') query.policyStatus = policyStatus;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.merchant = { $regex: search, $options: 'i' };
    }

    const expenses = await Expense.find(query)
      .populate('userId', 'name email department')
      .populate('receiptId')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
exports.getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('userId', 'name email department')
      .populate('receiptId')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    // Role check: employee can only view their own
    if (req.user.role === 'employee' && expense.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this expense record.' });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new expense (with policy check, fraud check, currency conversion, and split validation)
// @route   POST /api/expenses
exports.createExpense = async (req, res, next) => {
  try {
    const {
      merchant,
      date,
      amount,
      currency = 'USD',
      category,
      paymentMethod,
      description,
      receiptId,
      splitDetails,
      isMileage,
      mileageTripId,
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid expense amount is required.' });
    }

    // 1. Currency Conversion
    const reportingCurrency = req.user.preferredCurrency || 'USD';
    const conversion = await convertCurrency(parsedAmount, currency, reportingCurrency);

    // 2. Split Expense Validation: Sum of allocations must equal expense amount
    if (splitDetails && Array.isArray(splitDetails) && splitDetails.length > 0) {
      const splitSum = splitDetails.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const diff = Math.abs(splitSum - parsedAmount);
      if (diff > 0.05) {
        return res.status(400).json({
          success: false,
          message: `Split allocation sum ($${splitSum.toFixed(2)}) must exactly match the total expense amount ($${parsedAmount.toFixed(2)}).`,
        });
      }
    }

    // 3. Receipt verification if provided
    let receiptUrl = '';
    if (receiptId) {
      const r = await Receipt.findById(receiptId);
      if (r) {
        receiptUrl = `/uploads/${r.filename}`;
      }
    }

    // 4. Policy Compliance Engine
    const policyEvaluation = await evaluateExpensePolicy(
      {
        amount: parsedAmount,
        convertedAmount: conversion.convertedAmount,
        category,
        receiptId,
        receiptUrl,
      },
      req.user._id
    );

    // 5. Fraud and Anomaly Check
    const anomalyAssessment = await assessAnomalyRisk(
      {
        merchant,
        date: date || new Date(),
        amount: parsedAmount,
        convertedAmount: conversion.convertedAmount,
        category,
      },
      req.user._id,
      receiptId
    );

    // 6. Create Expense in DB
    const expense = await Expense.create({
      userId: req.user._id,
      merchant,
      date: date || new Date(),
      amount: parsedAmount,
      currency: currency.toUpperCase(),
      exchangeRate: conversion.exchangeRate,
      convertedAmount: conversion.convertedAmount,
      reportingCurrency: reportingCurrency.toUpperCase(),
      category: category || 'Other',
      paymentMethod: paymentMethod || 'Corporate Card',
      description: description || '',
      receiptId: receiptId || null,
      receiptUrl,
      status: 'submitted',
      policyStatus: policyEvaluation.policyStatus,
      policyViolations: policyEvaluation.violations,
      splitDetails: splitDetails || [],
      fraudRisk: {
        level: anomalyAssessment.level,
        flags: anomalyAssessment.flags,
        score: anomalyAssessment.score,
      },
      isMileage: Boolean(isMileage),
      mileageTripId: mileageTripId || null,
    });

    // If receipt was attached, link this expense to the receipt
    if (receiptId) {
      await Receipt.findByIdAndUpdate(receiptId, { expenseId: expense._id });
    }

    res.status(201).json({
      success: true,
      data: expense,
      policyCheck: policyEvaluation,
      fraudCheck: anomalyAssessment,
      currencyConversion: conversion,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update existing expense
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Role check
    if (req.user.role === 'employee' && expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this expense.' });
    }

    // Don't allow editing if already reimbursed
    if (expense.status === 'reimbursed') {
      return res.status(400).json({ success: false, message: 'Cannot edit an expense that has already been reimbursed.' });
    }

    const { merchant, date, amount, category, paymentMethod, description, splitDetails } = req.body;

    if (merchant) expense.merchant = merchant;
    if (date) expense.date = date;
    if (amount) {
      expense.amount = parseFloat(amount);
      const conversion = await convertCurrency(expense.amount, expense.currency, expense.reportingCurrency);
      expense.convertedAmount = conversion.convertedAmount;
      expense.exchangeRate = conversion.exchangeRate;
    }
    if (category) expense.category = category;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (description !== undefined) expense.description = description;
    if (splitDetails) expense.splitDetails = splitDetails;

    // Re-evaluate policies
    const policyEvaluation = await evaluateExpensePolicy(expense, expense.userId);
    expense.policyStatus = policyEvaluation.policyStatus;
    expense.policyViolations = policyEvaluation.violations;

    await expense.save();

    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (req.user.role === 'employee' && expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this record.' });
    }

    if (expense.status === 'approved' || expense.status === 'reimbursed') {
      return res.status(400).json({ success: false, message: 'Cannot delete an approved or reimbursed expense.' });
    }

    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
