const mongoose = require('mongoose');

const mileageTripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    startLocation: {
      type: String,
      required: [true, 'Starting location is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination location is required'],
      trim: true,
    },
    businessPurpose: {
      type: String,
      required: [true, 'Business purpose is required'],
      trim: true,
    },
    distanceMiles: {
      type: Number,
      required: [true, 'Distance in miles is required'],
      min: [0.1, 'Distance must be at least 0.1 miles'],
    },
    ratePerMile: {
      type: Number,
      default: 0.67, // Standard 2026 IRS Business Mileage Rate
      required: true,
    },
    reimbursementAmount: {
      type: Number,
      default: function () {
        return Math.round(this.distanceMiles * this.ratePerMile * 100) / 100;
      },
    },
    calculationType: {
      type: String,
      enum: ['manual', 'route_calculated'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'reimbursed'],
      default: 'submitted',
    },
    associatedExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MileageTrip', mileageTripSchema);
