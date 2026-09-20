const mongoose = require('mongoose');

const mileageSchema = new mongoose.Schema(
  {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startLocation: {
      type: String,
      required: [true, 'Starting location is required'],
    },
    endLocation: {
      type: String,
      required: [true, 'Destination is required'],
    },
    distance: {
      type: Number,
      required: [true, 'Distance is required'],
      min: 0,
    },
    distanceUnit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km',
    },
    ratePerUnit: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    travelDate: {
      type: Date,
      required: [true, 'Travel date is required'],
    },
    purpose: {
      type: String,
      default: '',
    },
    waypoints: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Mileage', mileageSchema);
