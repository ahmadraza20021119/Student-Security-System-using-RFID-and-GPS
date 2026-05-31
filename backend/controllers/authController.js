const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { MESSAGES, STATUS_CODES } = require('../utils/constants');

/**
 * Login admin user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ username }).select('+password');
    if (!admin) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false,
        message: MESSAGES.ERROR.INVALID_CREDENTIALS
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(STATUS_CODES.LOCKED).json({ 
        success: false,
        message: MESSAGES.ERROR.ACCOUNT_LOCKED
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ 
        success: false,
        message: MESSAGES.ERROR.ACCOUNT_INACTIVE
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      // Increment login attempts
      await admin.incLoginAttempts();
      
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false,
        message: MESSAGES.ERROR.INVALID_CREDENTIALS
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Generate JWT token
    const token = generateToken(admin);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Prepare response
    const adminResponse = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      lastLogin: admin.lastLogin,
      isActive: admin.isActive
    };

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.LOGIN,
      token,
      admin: adminResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get current admin profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: 'Admin profile not found'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Update admin profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: 'Admin profile not found'
      });
    }

    // Update fields
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;

    await admin.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.UPDATED,
      data: admin
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Change password
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const admin = await Admin.findById(req.admin.id).select('+password');
    
    if (!admin) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: 'Admin not found'
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    await admin.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Refresh token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const refreshToken = async (req, res) => {
  try {
    const admin = req.admin;

    // Generate new token
    const token = generateToken(admin);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Logout
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const logout = async (req, res) => {
  try {
    // In a more sophisticated system, you might maintain a blacklist of tokens
    // For now, we'll just send a success response
    
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.LOGOUT
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Verify token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const verifyToken = async (req, res) => {
  try {
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Token is valid',
      admin: {
        id: req.admin._id,
        username: req.admin.username,
        role: req.admin.role,
        permissions: req.admin.permissions
      }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Helper function to generate JWT token
 * @param {Object} admin - Admin object
 * @returns {String} - JWT token
 */
const generateToken = (admin) => {
  const payload = {
    id: admin._id,
    username: admin.username,
    role: admin.role,
    permissions: admin.permissions
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '24h',
      issuer: 'student-security-system',
      audience: 'student-security-frontend'
    }
  );
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  verifyToken
};