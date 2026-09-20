const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validate } = require('../middleware/validate');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  assignManager,
  createUserValidation,
} = require('../controllers/userController');

// All routes below require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUserValidation, validate, createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/role', changeUserRole);
router.put('/:id/manager', assignManager);

module.exports = router;
