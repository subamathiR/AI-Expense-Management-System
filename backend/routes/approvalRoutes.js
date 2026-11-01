const express = require('express');
const router = express.Router();
const {
  getPendingApprovals,
  approveExpense,
  rejectExpense,
  processReimbursement,
} = require('../controllers/approvalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/pending', protect, authorize('manager', 'finance', 'admin'), getPendingApprovals);
router.post('/:id/approve', protect, authorize('manager', 'admin'), approveExpense);
router.post('/:id/reject', protect, authorize('manager', 'admin'), rejectExpense);
router.post('/:id/reimburse', protect, authorize('finance', 'admin'), processReimbursement);

module.exports = router;
