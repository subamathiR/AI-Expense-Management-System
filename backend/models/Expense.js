const mongoose = require('mongoose');

const splitDetailSchema = new mongoose.Schema({
  allocationType: {
    type: String,
    enum: ['department', 'project', 'employee', 'cost_center'],
    default: 'department',
  },
  targetName: { type: String, required: true },
  amount: { type: Number, required: true },
  percentage: { type: Number, required: true },
});

const policyViolationSchema = new mongoose.Schema({
  ruleName: { type: String, required: true },
  configuredLimit: { type: Number },
  actualValue: { type: Number },
  severity: { type: String, enum: ['warning', 'violation'], default: 'warning' },
  message: { type: String, required: true },
});

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchant: {
      type: String,
      required: [true, 'Merchant / vendor name is required'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    exchangeRate: {
      type: Number,
      default: 1.0,
    },
    convertedAmount: {
      type: Number,
      default: function () {
        return this.amount;
      },
    },
    reportingCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: [
        'Travel',
        'Meals & Entertainment',
        'Office Supplies',
        'Software & Subscriptions',
        'Accommodation',
        'Transportation',
        'Utilities',
        'Marketing',
        'Equipment',
        'Other',
      ],
      default: 'Other',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: [
        'Corporate Card',
        'Corporate Card (Visa)',
        'Corporate Card (Mastercard)',
        'Corporate Card (AMEX)',
        'Personal Card',
        'Cash',
        'Bank Transfer',
        'Other',
      ],
      default: 'Corporate Card',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
      default: null,
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'reimbursement_pending',
        'reimbursed',
      ],
      default: 'submitted',
      index: true,
    },
    policyStatus: {
      type: String,
      enum: ['within_policy', 'requires_review', 'policy_violation'],
      default: 'within_policy',
      index: true,
    },
    policyViolations: [policyViolationSchema],
    splitDetails: [splitDetailSchema],
    fraudRisk: {
      level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
      },
      flags: [{ type: String }],
      score: { type: Number, default: 0 },
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    reimbursedAt: {
      type: Date,
      default: null,
    },
    reimbursementRef: {
      type: String,
      default: '',
    },
    isMileage: {
      type: Boolean,
      default: false,
    },
    mileageTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MileageTrip',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
