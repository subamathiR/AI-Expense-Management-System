const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const {
  getPolicies,
  createPolicy,
  updatePolicy,
} = require('../controllers/policyController');

// All routes require authentication
router.use(protect);

router.get('/', getPolicies);

// Only admins can modify policies
router.post('/', authorize('admin'), createPolicy);
router.put('/:id', authorize('admin'), updatePolicy);

module.exports = router;
