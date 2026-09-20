const ExpenseReport = require('../models/ExpenseReport');
const Approval = require('../models/Approval');
const User = require('../models/User');
const { REPORT_STATUS, APPROVAL_STATUS, AUDIT_ACTION } = require('../config/constants');
const { createAuditLog, getClientIp } = require('../utils/helpers');

/**
 * @desc    Get expense reports for user or team
 * @route   GET /api/reports
 * @access  Private
 */
const getReports = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') {
      filter.userId = req.user._id;
    }

    const reports = await ExpenseReport.find(filter)
      .populate('userId', 'firstName lastName email department')
      .populate('expenseIds')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new expense report
 * @route   POST /api/reports
 * @access  Private
 */
const createReport = async (req, res, next) => {
  try {
    const { title, description, period, expenseIds, department, project } = req.body;

    const report = await ExpenseReport.create({
      userId: req.user._id,
      title: title || 'Monthly Expense Report',
      description: description || '',
      period: period ? { startDate: new Date(), endDate: new Date() } : undefined,
      expenseIds: expenseIds || [],
      department: department || req.user.department || '',
      project: project || '',
      status: REPORT_STATUS.DRAFT,
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit expense report for approval
 * @route   POST /api/reports/:id/submit
 * @access  Private
 */
const submitReport = async (req, res, next) => {
  try {
    const report = await ExpenseReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Expense report not found' });
    }

    report.status = REPORT_STATUS.SUBMITTED;
    report.submittedAt = new Date();
    await report.save();

    const user = await User.findById(req.user._id);
    const approverId = user.managerId || (await User.findOne({ role: 'admin' }))._id;

    await Approval.create({
      reportId: report._id,
      approverId,
      level: 1,
      status: APPROVAL_STATUS.PENDING,
    });

    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.REPORT_SUBMITTED,
      entityType: 'report',
      entityId: report._id,
      details: { title: report.title },
      ipAddress: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: 'Report submitted for review successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  createReport,
  submitReport,
};
