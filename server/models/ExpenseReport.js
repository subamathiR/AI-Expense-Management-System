const mongoose = require('mongoose');
const { REPORT_STATUS } = require('../config/constants');

const expenseReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    expenseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.DRAFT,
    },
    period: {
      startDate: { type: Date },
      endDate: { type: Date },
    },
    department: {
      type: String,
      default: '',
    },
    project: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ExpenseReport', expenseReportSchema);
