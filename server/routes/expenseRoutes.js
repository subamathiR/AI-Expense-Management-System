const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  submitExpense,
  getExpenseStats,
} = require('../controllers/expenseController');

// All routes require authentication
router.use(protect);

router.get('/', getExpenses);
router.get('/stats', getExpenseStats);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.post('/:id/submit', submitExpense);

module.exports = router;
