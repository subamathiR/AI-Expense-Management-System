const Approval = require('../models/Approval');
const Expense = require('../models/Expense');
const ExpenseReport = require('../models/ExpenseReport');
const Notification = require('../models/Notification');
const { APPROVAL_STATUS, EXPENSE_STATUS, NOTIFICATION_TYPE, AUDIT_ACTION } = require('../config/constants');
const { createAuditLog, getClientIp } = require('../utils/helpers');

/**
 * @desc    Get approvals for current manager/admin
 * @route   GET /api/approvals
 * @access  Private (Manager / Admin)
 */
const getApprovals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    // Only filter by approver if not admin
    if (req.user.role !== 'admin') {
      filter.approverId = req.user._id;
    }

    if (status) {
      filter.status = status === 'submitted' ? APPROVAL_STATUS.PENDING : status;
    }

    const approvals = await Approval.find(filter)
      .populate({
        path: 'expenseId',
        populate: [
          { path: 'userId', select: 'firstName lastName email department' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .populate({
        path: 'reportId',
        populate: { path: 'userId', select: 'firstName lastName email department' }
      })
      .sort({ createdAt: -1 });

    const formatted = approvals.map(appr => {
      const exp = appr.expenseId;
      const user = exp?.userId || appr.reportId?.userId;

      return {
        _id: appr._id,
        level: appr.level,
        status: appr.status,
        comments: appr.comments,
        createdAt: appr.createdAt,
        employee: user ? {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          department: user.department
        } : { name: 'Unknown Employee', email: '' },
        vendor: exp?.vendor || exp?.title || appr.reportId?.title || 'Expense Claim',
        category: exp?.categoryId?.name || 'General',
        amount: exp?.amount || appr.reportId?.totalAmount || 0,
        currency: exp?.currency || 'USD',
        policyStatus: exp?.policyCompliance?.compliant === false ? 'violation' : 'compliant',
        anomalyStatus: exp?.anomalyDetection?.isAnomaly ? 'suspicious' : 'normal',
        expenseId: exp?._id || null,
        reportId: appr.reportId?._id || null,
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve an expense or report claim
 * @route   POST /api/approvals/:id/approve
 * @access  Private (Manager / Admin)
 */
const approveClaim = async (req, res, next) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval item not found' });
    }

    approval.status = APPROVAL_STATUS.APPROVED;
    approval.comments = req.body.comment || 'Approved via Manager Portal';
    approval.decidedAt = new Date();
    await approval.save();

    // Update underlying Expense if attached
    if (approval.expenseId) {
      const expense = await Expense.findById(approval.expenseId);
      if (expense) {
        expense.status = EXPENSE_STATUS.APPROVED;
        await expense.save();

        // Notify employee
        await Notification.create({
          userId: expense.userId,
          type: NOTIFICATION_TYPE.EXPENSE_APPROVED,
          title: 'Expense Claim Approved',
          message: `Your expense "${expense.title}" of $${expense.amount} has been approved.`,
          relatedId: expense._id,
          relatedType: 'expense',
        });
      }
    }

    // Update underlying Report if attached
    if (approval.reportId) {
      const report = await ExpenseReport.findById(approval.reportId);
      if (report) {
        report.status = 'approved';
        await report.save();
      }
    }

    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.EXPENSE_APPROVED,
      entityType: 'approval',
      entityId: approval._id,
      details: { comment: approval.comments },
      ipAddress: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: 'Claim approved successfully',
      data: approval,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject an expense or report claim
 * @route   POST /api/approvals/:id/reject
 * @access  Private (Manager / Admin)
 */
const rejectClaim = async (req, res, next) => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval item not found' });
    }

    approval.status = APPROVAL_STATUS.REJECTED;
    approval.comments = req.body.comment || 'Rejected by Manager';
    approval.decidedAt = new Date();
    await approval.save();

    // Update underlying Expense if attached
    if (approval.expenseId) {
      const expense = await Expense.findById(approval.expenseId);
      if (expense) {
        expense.status = EXPENSE_STATUS.REJECTED;
        await expense.save();

        // Notify employee
        await Notification.create({
          userId: expense.userId,
          type: NOTIFICATION_TYPE.EXPENSE_REJECTED,
          title: 'Expense Claim Rejected',
          message: `Your expense "${expense.title}" has been rejected. Reason: ${approval.comments}`,
          relatedId: expense._id,
          relatedType: 'expense',
        });
      }
    }

    // Update underlying Report if attached
    if (approval.reportId) {
      const report = await ExpenseReport.findById(approval.reportId);
      if (report) {
        report.status = 'rejected';
        await report.save();
      }
    }

    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.EXPENSE_REJECTED,
      entityType: 'approval',
      entityId: approval._id,
      details: { comment: approval.comments },
      ipAddress: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: 'Claim rejected successfully',
      data: approval,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApprovals,
  approveClaim,
  rejectClaim,
};
