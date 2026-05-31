const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    let token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    // Legacy support: Check cookies first, then header
    if (!token) {
        token = req.cookies['token'];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if admin still exists and is active
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid - admin not found or inactive' 
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error in authentication' 
    });
  }
};

// Check for specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied - no admin found' 
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied - ${req.admin.role} role is not authorized for this action` 
      });
    }

    next();
  };
};

// Check for specific permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied - no admin found' 
      });
    }

    if (!req.admin.permissions[permission]) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied - insufficient permissions for ${permission}` 
      });
    }

    next();
  };
};

module.exports = { auth, authorize, checkPermission };