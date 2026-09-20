const Expense = require('../models/Expense');
const Category = require('../models/Category');
const Policy = require('../models/Policy');
const Budget = require('../models/Budget');
const User = require('../models/User');
const Approval = require('../models/Approval');
const Notification = require('../models/Notification');
const Mileage = require('../models/Mileage');
const Receipt = require('../models/Receipt');
const { EXPENSE_STATUS, NOTIFICATION_TYPE, APPROVAL_STATUS, AUDIT_ACTION } = require('../config/constants');
const { createAuditLog, getClientIp } = require('../utils/helpers');

// Modular Services
const aiService = require('../services/ai/aiService');
const anomalyDetector = require('../services/fraud/anomalyDetector');
const policyEngine = require('../services/policy/policyEngine');
const fxService = require('../services/currency/fxService');

/**
 * Helper to classify category based on keywords
 */
const autoClassifyCategory = async (title, vendor) => {
  const text = `${title} ${vendor}`.toLowerCase();
  const categories = await Category.find({ isActive: true });

  for (const category of categories) {
    if (category.keywords && category.keywords.length > 0) {
      for (const keyword of category.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return { categoryId: category._id, name: category.name, confidence: 90 };
        }
      }
    }
  }

  // Fallback to "Other" category
  const otherCategory = categories.find(c => c.name === 'Other');
  return {
    categoryId: otherCategory ? otherCategory._id : null,
    name: otherCategory ? otherCategory.name : 'Other',
    confidence: 50
  };
};

/**
 * Helper to check policy compliance
 */
const checkPolicyCompliance = async (categoryId, amount, description = '', tags = []) => {
  const violations = [];
  let policyCompliant = true;

  if (!categoryId) return { policyCompliant, violations };

  // Fetch category
  const category = await Category.findById(categoryId);
  if (!category) return { policyCompliant, violations };

  // Fetch policies matching this category or general policies
  const policies = await Policy.find({
    isActive: true,
    $or: [{ categoryId: categoryId }, { categoryId: null }]
  });

  for (const policy of policies) {
    // Check maxAmount per expense limit
    if (policy.maxAmount && policy.maxAmountPeriod === 'per_expense') {
      if (amount > policy.maxAmount) {
        violations.push(`Exceeds limit of $${policy.maxAmount} for policy: "${policy.name}"`);
        policyCompliant = false;
      }
    }

    // Check flight class restrictions
    if (policy.allowedClasses && policy.allowedClasses.length > 0) {
      const allowed = policy.allowedClasses.map(c => c.toLowerCase());
      const descLower = description.toLowerCase();
      const hasRestrictedClass = ['first class', 'business class', 'first-class', 'business-class'].some(c => descLower.includes(c));
      const hasAllowed = allowed.some(c => descLower.includes(c));

      if (hasRestrictedClass && !hasAllowed) {
        violations.push(`Policy "${policy.name}" restricts booking classes to: ${policy.allowedClasses.join(', ')}`);
        policyCompliant = false;
      }
    }
  }

  return { policyCompliant, violations };
};

/**
 * Helper to check and flag duplicate expenses
 */
const checkAndFlagDuplicates = async (userId, vendor, amount, date, currentExpenseId = null) => {
  if (!vendor || !amount || !date) return { duplicateFlag: false, duplicateIds: [] };

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Query duplicates
  const query = {
    userId,
    amount,
    vendor: { $regex: new RegExp(`^${vendor.trim()}$`, 'i') },
    date: { $gte: startOfDay, $lte: endOfDay }
  };

  if (currentExpenseId) {
    query._id = { $ne: currentExpenseId };
  }

  const duplicates = await Expense.find(query);

  if (duplicates.length > 0) {
    const duplicateIds = duplicates.map(d => d._id);
    return { duplicateFlag: true, duplicateIds };
  }

  return { duplicateFlag: false, duplicateIds: [] };
};

/**
 * @desc    Get expenses with filter, search, sort, and pagination
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = async (req, res, next) => {
  try {
    const { status, categoryId, startDate, endDate, search, sort, page = 1, limit = 10, scope } = req.query;

    const query = {};

    // Scope check: managers viewing team or admin viewing all
    if (scope === 'team' && req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user._id });
      const teamIds = teamMembers.map(m => m._id);
      query.userId = { $in: teamIds };
    } else if (scope === 'all' && req.user.role === 'admin') {
      // Admin sees all
    } else {
      // Default: employee sees their own
      query.userId = req.user._id;
    }

    // Filters
    if (status) {
      query.status = status;
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOrder = sort ? sort.split(',').join(' ') : '-createdAt';

    const expenses = await Expense.find(query)
      .populate('categoryId')
      .populate('receiptId')
      .populate('userId', 'firstName lastName email department')
      .sort(sortOrder)
      .skip(skip)
      .limit(Number(limit));

    const total = await Expense.countDocuments(query);

    res.status(200).json({
      success: true,
      count: expenses.length,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single expense by ID
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('categoryId')
      .populate('receiptId')
      .populate('userId', 'firstName lastName email department managerId');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Permission check
    const isOwner = expense.userId._id.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager' && expense.userId.managerId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this expense',
      });
    }

    // If mileage expense, fetch mileage details
    let mileageDetails = null;
    if (expense.type === 'mileage') {
      mileageDetails = await Mileage.findOne({ expenseId: expense._id });
    }

    res.status(200).json({
      success: true,
      data: {
        ...expense.toObject(),
        mileage: mileageDetails
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new expense (supporting regular and mileage)
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = async (req, res, next) => {
  try {
    let {
      title,
      description,
      amount,
      categoryId,
      date,
      vendor,
      type,
      tags,
      receiptId,
      mileageDetails // containing: startLocation, endLocation, distance, ratePerUnit
    } = req.body;

    type = type || 'regular';

    // Auto-classify category if categoryId is not provided
    let aiConfidence = 85;
    if (!categoryId) {
      const aiResult = await aiService.categorizeExpense(vendor || '', title || '', amount);
      categoryId = aiResult.categoryId;
      aiConfidence = aiResult.confidence;
    }

    // Currency Conversion if original currency is provided
    let originalAmount = null;
    let originalCurrency = req.body.currency || 'USD';
    let exchangeRate = 1.0;
    if (originalCurrency !== 'USD') {
      const converted = fxService.convertAmount(amount, originalCurrency, 'USD');
      originalAmount = amount;
      amount = converted.convertedAmount;
      exchangeRate = converted.exchangeRate;
    }

    // Anomaly / Fraud Detection
    const anomalyResult = await anomalyDetector.analyzeExpense(req.user._id, categoryId, amount);

    // Calculate policy compliance
    const { policyCompliant, violations } = await checkPolicyCompliance(categoryId, amount, description, tags);

    // Check duplicates
    const { duplicateFlag, duplicateIds } = await checkAndFlagDuplicates(req.user._id, vendor, amount, date);

    // Create expense
    const expense = await Expense.create({
      userId: req.user._id,
      title,
      description,
      amount,
      originalAmount,
      originalCurrency,
      exchangeRate,
      currency: 'USD',
      categoryId,
      date,
      vendor: vendor || '',
      type,
      tags: tags || [],
      receiptId: receiptId || null,
      policyCompliant,
      policyViolations: violations,
      duplicateFlag,
      duplicateExpenseIds: duplicateIds,
      anomalyFlag: anomalyResult.isAnomaly,
      anomalyDetails: anomalyResult.reason || '',
      aiConfidence,
      status: EXPENSE_STATUS.DRAFT
    });

    // If duplicate found, update the reference on the matching duplicates as well
    if (duplicateFlag && duplicateIds.length > 0) {
      await Expense.updateMany(
        { _id: { $in: duplicateIds } },
        {
          $set: { duplicateFlag: true },
          $addToSet: { duplicateExpenseIds: expense._id }
        }
      );
    }

    // Handle mileage creation
    if (type === 'mileage' && mileageDetails) {
      await Mileage.create({
        expenseId: expense._id,
        userId: req.user._id,
        startLocation: mileageDetails.startLocation,
        endLocation: mileageDetails.endLocation,
        distance: mileageDetails.distance,
        distanceUnit: mileageDetails.distanceUnit || 'km',
        ratePerUnit: mileageDetails.ratePerUnit || 0.50,
        totalAmount: amount,
        travelDate: date,
        purpose: description || ''
      });
    }

    // Create audit log
    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.EXPENSE_CREATED,
      entityType: 'expense',
      entityId: expense._id,
      details: { title, amount, type },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Permission check
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense',
      });
    }

    // Can only edit draft or rejected expenses
    if (expense.status !== EXPENSE_STATUS.DRAFT && expense.status !== EXPENSE_STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        message: `Cannot update an expense with status: ${expense.status}`,
      });
    }

    const {
      title,
      description,
      amount,
      categoryId,
      date,
      vendor,
      type,
      tags,
      receiptId,
      mileageDetails
    } = req.body;

    if (title !== undefined) expense.title = title;
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (categoryId !== undefined) expense.categoryId = categoryId;
    if (date !== undefined) expense.date = date;
    if (vendor !== undefined) expense.vendor = vendor;
    if (type !== undefined) expense.type = type;
    if (tags !== undefined) expense.tags = tags;
    if (receiptId !== undefined) expense.receiptId = receiptId;

    // Recalculate checks
    const finalCategoryId = categoryId || expense.categoryId;
    const finalAmount = amount !== undefined ? amount : expense.amount;
    const finalVendor = vendor !== undefined ? vendor : expense.vendor;
    const finalDate = date !== undefined ? date : expense.date;

    const { policyCompliant, violations } = await checkPolicyCompliance(
      finalCategoryId,
      finalAmount,
      description !== undefined ? description : expense.description,
      tags || expense.tags
    );
    expense.policyCompliant = policyCompliant;
    expense.policyViolations = violations;

    const { duplicateFlag, duplicateIds } = await checkAndFlagDuplicates(
      req.user._id,
      finalVendor,
      finalAmount,
      finalDate,
      expense._id
    );
    expense.duplicateFlag = duplicateFlag;
    expense.duplicateExpenseIds = duplicateIds;

    await expense.save();

    // If duplicate found, update the reference on the matching duplicates as well
    if (duplicateFlag && duplicateIds.length > 0) {
      await Expense.updateMany(
        { _id: { $in: duplicateIds } },
        {
          $set: { duplicateFlag: true },
          $addToSet: { duplicateExpenseIds: expense._id }
        }
      );
    }

    // Handle mileage update
    if (expense.type === 'mileage' && mileageDetails) {
      let mileage = await Mileage.findOne({ expenseId: expense._id });
      if (mileage) {
        if (mileageDetails.startLocation !== undefined) mileage.startLocation = mileageDetails.startLocation;
        if (mileageDetails.endLocation !== undefined) mileage.endLocation = mileageDetails.endLocation;
        if (mileageDetails.distance !== undefined) mileage.distance = mileageDetails.distance;
        if (mileageDetails.distanceUnit !== undefined) mileage.distanceUnit = mileageDetails.distanceUnit;
        if (mileageDetails.ratePerUnit !== undefined) mileage.ratePerUnit = mileageDetails.ratePerUnit;
        mileage.totalAmount = finalAmount;
        mileage.travelDate = finalDate;
        mileage.purpose = description || expense.description || '';
        await mileage.save();
      } else {
        await Mileage.create({
          expenseId: expense._id,
          userId: req.user._id,
          startLocation: mileageDetails.startLocation,
          endLocation: mileageDetails.endLocation,
          distance: mileageDetails.distance,
          distanceUnit: mileageDetails.distanceUnit || 'km',
          ratePerUnit: mileageDetails.ratePerUnit || 0.50,
          totalAmount: finalAmount,
          travelDate: finalDate,
          purpose: description || expense.description || ''
        });
      }
    }

    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.EXPENSE_EDITED,
      entityType: 'expense',
      entityId: expense._id,
      details: { title: expense.title, amount: expense.amount },
      ipAddress: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Permission check
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense',
      });
    }

    // Can only delete draft expenses
    if (expense.status !== EXPENSE_STATUS.DRAFT) {
      return res.status(400).json({
        success: false,
        message: 'Only draft expenses can be deleted',
      });
    }

    // Remove mileage details if any
    if (expense.type === 'mileage') {
      await Mileage.deleteOne({ expenseId: expense._id });
    }

    await Expense.deleteOne({ _id: expense._id });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit an expense for approval
 * @route   POST /api/expenses/:id/submit
 * @access  Private
 */
const submitExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Permission check
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this expense',
      });
    }

    if (expense.status !== EXPENSE_STATUS.DRAFT && expense.status !== EXPENSE_STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        message: 'Expense can only be submitted if it is in draft or rejected status',
      });
    }

    // Update status
    expense.status = EXPENSE_STATUS.SUBMITTED;
    await expense.save();

    // Find approver: Manager or Admin fallback
    const user = await User.findById(req.user._id);
    const approverId = user.managerId || (await User.findOne({ role: 'admin' }))._id;

    // Create approval entry
    await Approval.create({
      expenseId: expense._id,
      approverId,
      level: 1,
      status: APPROVAL_STATUS.PENDING
    });

    // Create notification
    await Notification.create({
      userId: approverId,
      type: NOTIFICATION_TYPE.APPROVAL_REQUEST,
      title: 'New Approval Request',
      message: `${user.firstName} ${user.lastName} submitted a new expense for approval: "${expense.title}"`,
      relatedId: expense._id,
      relatedType: 'expense'
    });

    // Create audit log
    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.EXPENSE_SUBMITTED,
      entityType: 'expense',
      entityId: expense._id,
      details: { title: expense.title, amount: expense.amount },
      ipAddress: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: 'Expense submitted for approval successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get expense statistics
 * @route   GET /api/expenses/stats
 * @access  Private
 */
const getExpenseStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const allExpenses = await Expense.find({ userId });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: allExpenses.length,
      pending: allExpenses.filter((e) => ['submitted', 'under_review', 'processing'].includes(e.status)).length,
      approved: allExpenses.filter((e) => e.status === 'approved').length,
      rejected: allExpenses.filter((e) => e.status === 'rejected').length,
      reimbursed: allExpenses.filter((e) => e.status === 'reimbursed').length,
      totalAmount: allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      monthlySpending: allExpenses
        .filter((e) => new Date(e.date) >= monthStart)
        .reduce((sum, e) => sum + (e.amount || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  submitExpense,
  getExpenseStats,
};
