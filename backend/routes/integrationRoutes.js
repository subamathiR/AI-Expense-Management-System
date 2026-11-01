const express = require('express');
const router = express.Router();
const {
  getIntegrations,
  updateIntegration,
  testIntegrationConnection,
  triggerSync,
} = require('../controllers/integrationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getIntegrations);
router.put('/:id', protect, authorize('admin', 'finance'), updateIntegration);
router.post('/:id/test', protect, authorize('admin', 'finance'), testIntegrationConnection);
router.post('/:id/sync', protect, authorize('admin', 'finance'), triggerSync);

module.exports = router;
