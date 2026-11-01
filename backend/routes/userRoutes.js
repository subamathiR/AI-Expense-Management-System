const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);

module.exports = router;
