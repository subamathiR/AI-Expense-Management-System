const { body } = require('express-validator');
const User = require('../models/User');
const { createAuditLog, getClientIp } = require('../utils/helpers');
const { AUDIT_ACTION } = require('../config/constants');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .populate('managerId', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Admin
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create user (admin)
 * @route   POST /api/users
 * @access  Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, department, managerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'employee',
      department: department || '',
      managerId: managerId || null,
    });

    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.USER_CREATED,
      entityType: 'user',
      entityId: user._id,
      details: { email, role: user.role, createdBy: req.user.email },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, department, managerId, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, department, managerId, isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: AUDIT_ACTION.USER_UPDATED,
      entityType: 'user',
      entityId: user._id,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: getClientIp(req),
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user role
 * @route   PUT /api/users/:id/role
 * @access  Admin
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['employee', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be employee, manager, or admin.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign manager to user
 * @route   PUT /api/users/:id/manager
 * @access  Admin
 */
const assignManager = async (req, res, next) => {
  try {
    const { managerId } = req.body;

    // Verify manager exists and has manager/admin role
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Manager not found.',
        });
      }
      if (!['manager', 'admin'].includes(manager.role)) {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not a manager or admin.',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { managerId: managerId || null },
      { new: true }
    ).populate('managerId', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: 'Manager assigned successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const createUserValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  assignManager,
  createUserValidation,
};
