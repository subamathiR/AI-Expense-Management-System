const Policy = require('../models/Policy');

// @desc    Get all policies
// @route   GET /api/policies
exports.getPolicies = async (req, res, next) => {
  try {
    const policies = await Policy.find({}).sort({ category: 1 });
    res.status(200).json({ success: true, count: policies.length, data: policies });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update policy (Admin)
// @route   POST /api/policies
exports.createPolicy = async (req, res, next) => {
  try {
    const {
      name,
      category,
      department,
      maxAmountPerExpense,
      dailyLimit,
      monthlyLimit,
      requiresReceiptAbove,
      managerApprovalThreshold,
      isReceiptMandatory,
      description,
      isActive,
    } = req.body;

    // Check if policy for this category exists, update or create
    let policy = await Policy.findOne({ category });
    if (policy) {
      if (name) policy.name = name;
      if (maxAmountPerExpense !== undefined) policy.maxAmountPerExpense = maxAmountPerExpense;
      if (dailyLimit !== undefined) policy.dailyLimit = dailyLimit;
      if (monthlyLimit !== undefined) policy.monthlyLimit = monthlyLimit;
      if (requiresReceiptAbove !== undefined) policy.requiresReceiptAbove = requiresReceiptAbove;
      if (managerApprovalThreshold !== undefined) policy.managerApprovalThreshold = managerApprovalThreshold;
      if (isReceiptMandatory !== undefined) policy.isReceiptMandatory = isReceiptMandatory;
      if (description !== undefined) policy.description = description;
      if (isActive !== undefined) policy.isActive = isActive;

      await policy.save();
      return res.status(200).json({ success: true, message: 'Policy updated', data: policy });
    }

    policy = await Policy.create({
      name: name || `${category} Policy`,
      category,
      department: department || 'All',
      maxAmountPerExpense: maxAmountPerExpense || 500,
      dailyLimit: dailyLimit || 1000,
      monthlyLimit: monthlyLimit || 5000,
      requiresReceiptAbove: requiresReceiptAbove || 25,
      managerApprovalThreshold: managerApprovalThreshold || 250,
      isReceiptMandatory: isReceiptMandatory !== undefined ? isReceiptMandatory : true,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, message: 'Policy created', data: policy });
  } catch (err) {
    next(err);
  }
};

// @desc    Update single policy by ID
// @route   PUT /api/policies/:id
exports.updatePolicyById = async (req, res, next) => {
  try {
    const policy = await Policy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    res.status(200).json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
};
