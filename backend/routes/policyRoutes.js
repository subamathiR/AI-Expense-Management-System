const express = require('express');
const router = express.Router();
const {
  getPolicies,
  createPolicy,
  updatePolicyById,
} = require('../controllers/policyController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getPolicies);
router.post('/', protect, authorize('admin', 'finance'), createPolicy);
router.put('/:id', protect, authorize('admin', 'finance'), updatePolicyById);

module.exports = router;
