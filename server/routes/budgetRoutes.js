const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getBudgets,
  createBudget,
  updateBudget,
  getBudgetUsage,
} = require('../controllers/budgetController');

// All routes require authentication
router.use(protect);

router.get('/', getBudgets);
router.get('/usage', getBudgetUsage);

// Only admins can modify budgets
router.post('/', authorize('admin'), createBudget);
router.put('/:id', authorize('admin'), updateBudget);

module.exports = router;
