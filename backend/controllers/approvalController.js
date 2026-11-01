const Expense = require('../models/Expense');
const Notification = require('../models/Notification');

// @desc    Get pending claims for review (Managers and Finance)
// @route   GET /api/approvals/pending
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const { filterStatus } = req.query;

    const query = {};
    if (filterStatus) {
      query.status = filterStatus;
    } else {
      // By default, show submitted, under_review, and approved (for finance reimbursement queue)
      query.status = { $in: ['submitted', 'under_review', 'approved'] };
    }

    const expenses = await Expense.find(query)
      .populate('userId', 'name email department')
      .populate('receiptId')
      .populate('approvedBy', 'name email')
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

// @desc    Approve an expense (Manager or Admin)
// @route   POST /api/approvals/:id/approve
exports.approveExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Security rule: Employee cannot approve their own claim unless Admin
    if (expense.userId.toString() === req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Employees are not permitted to approve their own expense claims.',
      });
    }

    expense.status = 'approved';
    expense.approvedBy = req.user._id;
    expense.approvedAt = new Date();
    expense.rejectionReason = '';

    await expense.save();

    // Create notification for employee
    await Notification.create({
      userId: expense.userId,
      title: 'Expense Claim Approved',
      message: `Your claim for "${expense.merchant}" ($${expense.amount.toFixed(2)}) was approved by ${req.user.name}. It is now queued for finance reimbursement.`,
      type: 'approval_request',
      link: 'expenses.html',
    });

    res.status(200).json({
      success: true,
      message: 'Expense claim approved successfully.',
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject an expense (Manager or Admin)
// @route   POST /api/approvals/:id/reject
exports.rejectExpense = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a clear rejection reason.' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    expense.status = 'rejected';
    expense.rejectionReason = reason.trim();
    expense.approvedBy = req.user._id;
    expense.approvedAt = new Date();

    await expense.save();

    // Notify employee
    await Notification.create({
      userId: expense.userId,
      title: 'Expense Claim Rejected',
      message: `Your claim for "${expense.merchant}" ($${expense.amount.toFixed(2)}) was rejected. Reason: ${reason}`,
      type: 'approval_request',
      link: 'expenses.html',
    });

    res.status(200).json({
      success: true,
      message: 'Expense claim rejected with explanation.',
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process reimbursement payment (Finance or Admin)
// @route   POST /api/approvals/:id/reimburse
exports.processReimbursement = async (req, res, next) => {
  try {
    const { referenceNumber } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expense.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only manager-approved expenses can be processed for reimbursement.',
      });
    }

    expense.status = 'reimbursed';
    expense.reimbursedAt = new Date();
    expense.reimbursementRef = referenceNumber || `TXN-ACH-${Date.now()}`;

    await expense.save();

    // Notify employee
    await Notification.create({
      userId: expense.userId,
      title: 'Reimbursement Settled',
      message: `Reimbursement payment of $${expense.amount.toFixed(2)} for "${expense.merchant}" has been issued. Ref: ${expense.reimbursementRef}`,
      type: 'reimbursement',
      link: 'expenses.html',
    });

    res.status(200).json({
      success: true,
      message: 'Reimbursement processed successfully.',
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};
