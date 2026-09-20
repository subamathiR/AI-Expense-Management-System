const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    department: {
      type: String,
      default: '',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total budget amount is required'],
      min: 0,
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    warningThresholds: {
      type: [Number],
      default: [70, 80, 90, 100],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function () {
  return this.totalAmount - this.spentAmount;
});

// Virtual for percentage used
budgetSchema.virtual('percentageUsed').get(function () {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.spentAmount / this.totalAmount) * 100);
});

budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);
