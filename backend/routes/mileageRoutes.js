const express = require('express');
const router = express.Router();
const { getMileageTrips, createMileageTrip } = require('../controllers/mileageController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMileageTrips);
router.post('/', protect, createMileageTrip);

module.exports = router;
