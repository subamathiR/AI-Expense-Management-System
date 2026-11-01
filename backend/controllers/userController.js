const User = require('../models/User');

// @desc    Get all users (for team dropdowns, splits, and manager assignments)
// @route   GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('name email role department');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, department } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (department) user.department = department;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
