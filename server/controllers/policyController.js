const Policy = require('../models/Policy');

/**
 * @desc    Get all active policies
 * @route   GET /api/policies
 * @access  Private
 */
const getPolicies = async (req, res, next) => {
  try {
    const policies = await Policy.find({ isActive: true }).populate('categoryId');
    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new policy
 * @route   POST /api/policies
 * @access  Private/Admin
 */
const createPolicy = async (req, res, next) => {
  try {
    const { name, description, categoryId, maxAmount, maxAmountPeriod, allowedClasses, requiresReceipt, rules } = req.body;

    const policy = await Policy.create({
      name,
      description,
      categoryId: categoryId || null,
      maxAmount,
      maxAmountPeriod: maxAmountPeriod || 'per_expense',
      allowedClasses: allowedClasses || [],
      requiresReceipt: requiresReceipt || false,
      rules: rules || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a policy
 * @route   PUT /api/policies/:id
 * @access  Private/Admin
 */
const updatePolicy = async (req, res, next) => {
  try {
    const { name, description, categoryId, maxAmount, maxAmountPeriod, allowedClasses, requiresReceipt, rules, isActive } = req.body;

    let policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
      });
    }

    if (name !== undefined) policy.name = name;
    if (description !== undefined) policy.description = description;
    if (categoryId !== undefined) policy.categoryId = categoryId || null;
    if (maxAmount !== undefined) policy.maxAmount = maxAmount;
    if (maxAmountPeriod !== undefined) policy.maxAmountPeriod = maxAmountPeriod;
    if (allowedClasses !== undefined) policy.allowedClasses = allowedClasses;
    if (requiresReceipt !== undefined) policy.requiresReceipt = requiresReceipt;
    if (rules !== undefined) policy.rules = rules;
    if (isActive !== undefined) policy.isActive = isActive;

    await policy.save();

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPolicies,
  createPolicy,
  updatePolicy,
};
