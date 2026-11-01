const MileageTrip = require('../models/MileageTrip');
const Expense = require('../models/Expense');

// @desc    Get mileage trips
// @route   GET /api/mileage
exports.getMileageTrips = async (req, res, next) => {
  try {
    const filter = req.user.role === 'employee' ? { userId: req.user._id } : {};
    const trips = await MileageTrip.find(filter)
      .populate('userId', 'name email department')
      .sort({ tripDate: -1 });

    res.status(200).json({ success: true, count: trips.length, data: trips });
  } catch (err) {
    next(err);
  }
};

// @desc    Log a new mileage trip
// @route   POST /api/mileage
exports.createMileageTrip = async (req, res, next) => {
  try {
    const {
      tripDate,
      startLocation,
      destination,
      businessPurpose,
      distanceMiles,
      ratePerMile,
      calculationType,
      autoCreateExpense,
    } = req.body;

    const parsedDistance = parseFloat(distanceMiles);
    if (isNaN(parsedDistance) || parsedDistance <= 0) {
      return res.status(400).json({ success: false, message: 'Valid distance in miles is required.' });
    }

    const rate = parseFloat(ratePerMile) || 0.67;
    const reimbursementAmount = Math.round(parsedDistance * rate * 100) / 100;

    const trip = await MileageTrip.create({
      userId: req.user._id,
      tripDate: tripDate || new Date(),
      startLocation,
      destination,
      businessPurpose,
      distanceMiles: parsedDistance,
      ratePerMile: rate,
      reimbursementAmount,
      calculationType: calculationType || 'manual',
      status: 'submitted',
    });

    // Optionally auto-create corresponding Expense
    if (autoCreateExpense) {
      const expense = await Expense.create({
        userId: req.user._id,
        merchant: `Mileage: ${startLocation} to ${destination}`,
        date: tripDate || new Date(),
        amount: reimbursementAmount,
        currency: 'USD',
        category: 'Transportation',
        paymentMethod: 'Personal Card',
        description: `Business mileage trip (${parsedDistance} miles @ $${rate}/mi). Purpose: ${businessPurpose}`,
        status: 'submitted',
        isMileage: true,
        mileageTripId: trip._id,
      });

      trip.associatedExpenseId = expense._id;
      await trip.save();
    }

    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};
