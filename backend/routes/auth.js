const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find admin by username
    const admin = await Admin.findOne({ username }).select('+password');
    if (!admin) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({ 
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated. Please contact system administrator.' 
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      // Increment login attempts
      await admin.incLoginAttempts();
      
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Generate JWT token
    const payload = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRE || '24h',
        issuer: 'student-security-system',
        audience: 'student-security-frontend'
      }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Remove password from response
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

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || true, // Force true if user asked, but usually depends on https. Assuming localhost is http, secure: true might fail on some browsers unless localhost. Let's force true as requested but note that it requires HTTPS in production.
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      admin: adminResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
}));

// @desc    Get current admin profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('-password');
  
  if (!admin) {
    return res.status(404).json({ 
      success: false,
      message: 'Admin profile not found' 
    });
  }

  res.json({
    success: true,
    data: admin
  });
}));

// @desc    Update admin profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  
  const admin = await Admin.findById(req.admin.id);
  
  if (!admin) {
    return res.status(404).json({ 
      success: false,
      message: 'Admin profile not found' 
    });
  }

  // Update fields
  if (fullName) admin.fullName = fullName;
  if (email) admin.email = email;

  await admin.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: admin
  });
}));

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', auth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide current password and new password' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false,
      message: 'New password must be at least 6 characters long' 
    });
  }

  const admin = await Admin.findById(req.admin.id).select('+password');
  
  if (!admin) {
    return res.status(404).json({ 
      success: false,
      message: 'Admin not found' 
    });
  }

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    return res.status(400).json({ 
      success: false,
      message: 'Current password is incorrect' 
    });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
  admin.password = await bcrypt.hash(newPassword, salt);

  await admin.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', auth, asyncHandler(async (req, res) => {
  const admin = req.admin;

  // Generate new token
  const payload = {
    id: admin._id,
    username: admin.username,
    role: admin.role,
    permissions: admin.permissions
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '24h',
      issuer: 'student-security-system',
      audience: 'student-security-frontend'
    }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully'
  });
}));

// @desc    Logout (client-side token invalidation)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', auth, asyncHandler(async (req, res) => {
  // In a more sophisticated system, you might maintain a blacklist of tokens
  // For now, we'll just send a success response and let the client handle token removal
  
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// @desc    Verify token (for client-side token validation)
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', auth, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      role: req.admin.role,
      permissions: req.admin.permissions
    }
  });
}));

module.exports = router;