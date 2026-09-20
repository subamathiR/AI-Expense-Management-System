const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getApprovals,
  approveClaim,
  rejectClaim,
} = require('../controllers/approvalController');

router.use(protect);
router.use(authorize('manager', 'admin'));

router.get('/', getApprovals);
router.post('/:id/approve', approveClaim);
router.post('/:id/reject', rejectClaim);

module.exports = router;
