const ExpenseReport = require('../models/ExpenseReport');
const Expense = require('../models/Expense');

// @desc    Get expense reports
// @route   GET /api/reports
exports.getReports = async (req, res, next) => {
  try {
    const filter = req.user.role === 'employee' ? { userId: req.user._id } : {};
    const reports = await ExpenseReport.find(filter)
      .populate('userId', 'name email department')
      .populate('expenseIds')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate / Create an expense report
// @route   POST /api/reports
exports.createReport = async (req, res, next) => {
  try {
    const { title, periodStart, periodEnd, expenseIds, notes } = req.body;

    if (!title || !periodStart || !periodEnd) {
      return res.status(400).json({ success: false, message: 'Please provide title, start date, and end date.' });
    }

    // If expenseIds provided, fetch expenses; otherwise fetch eligible user expenses in date range
    let selectedExpenses = [];
    if (expenseIds && expenseIds.length > 0) {
      selectedExpenses = await Expense.find({ _id: { $in: expenseIds } });
    } else {
      selectedExpenses = await Expense.find({
        userId: req.user._id,
        date: { $gte: new Date(periodStart), $lte: new Date(periodEnd) },
      });
    }

    const totalAmount = selectedExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);
    const taxTotal = selectedExpenses.reduce((sum, e) => sum + 0, 0); // tax if any

    const reportCount = await ExpenseReport.countDocuments();
    const reportNumber = `RPT-${new Date().getFullYear()}-${String(reportCount + 1).padStart(4, '0')}`;

    const report = await ExpenseReport.create({
      reportNumber,
      title,
      userId: req.user._id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      expenseIds: selectedExpenses.map((e) => e._id),
      totalAmount: Math.round(totalAmount * 100) / 100,
      taxTotal,
      currency: req.user.preferredCurrency || 'USD',
      status: 'submitted',
      notes: notes || '',
      submittedAt: new Date(),
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
exports.getReportById = async (req, res, next) => {
  try {
    const report = await ExpenseReport.findById(req.params.id)
      .populate('userId', 'name email department')
      .populate({
        path: 'expenseIds',
        populate: { path: 'receiptId' },
      });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Expense report not found.' });
    }

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// @desc    Export report as CSV
// @route   GET /api/reports/:id/export-csv
exports.exportReportCSV = async (req, res, next) => {
  try {
    const report = await ExpenseReport.findById(req.params.id)
      .populate('userId', 'name email department')
      .populate('expenseIds');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    let csv = 'Expense ID,Date,Merchant,Category,Amount,Currency,Payment Method,Policy Status,Status\r\n';

    report.expenseIds.forEach((exp) => {
      const row = [
        exp._id,
        new Date(exp.date).toISOString().split('T')[0],
        `"${(exp.merchant || '').replace(/"/g, '""')}"`,
        `"${exp.category}"`,
        exp.amount.toFixed(2),
        exp.currency,
        `"${exp.paymentMethod}"`,
        exp.policyStatus,
        exp.status,
      ];
      csv += row.join(',') + '\r\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.reportNumber}-expenses.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};
