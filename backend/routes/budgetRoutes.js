const express = require('express');
const router = express.Router();
const { getBudgets, createOrUpdateBudget } = require('../controllers/budgetController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getBudgets);
router.post('/', protect, authorize('admin', 'finance', 'manager'), createOrUpdateBudget);

module.exports = router;
