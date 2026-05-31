const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Student validation rules
const validateStudent = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.\'-]+$/)
    .withMessage('Name can only contain letters, spaces, dots, apostrophes, and hyphens'),
    
  body('studentId')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Student ID must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Student ID can only contain letters, numbers, and hyphens'),
    
  body('rfidTag')
    .trim()
    .isLength({ min: 4, max: 50 })
    .withMessage('RFID Tag must be between 4 and 50 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('RFID Tag can only contain letters and numbers'),
    
  body('section')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Section must be between 1 and 10 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/)
    .withMessage('Section can only contain letters, numbers, spaces, and hyphens'),
    
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
     
      return true;
    }),
    
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
    
  body('studentEmail')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Student email must be a valid email address'),
   
  body('address')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Address must be between 3 and 500 characters'),
    
  body('emergencyContact')
    .trim()
    .matches(/^[0-9+\-\s]+$/)
    .withMessage('Emergency contact can only contain numbers, spaces, hyphens, and +'),
    
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be valid (A+, A-, B+, B-, AB+, AB-, O+, O-)'),
    
  body('medicalConditions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Medical conditions must not exceed 1000 characters'),

  body('department')
    .isIn(['CSE','ECE','EEE','ME','CE','IT','AIML','DS','CIV','BIO','CHE','Other'])
    .withMessage('Invalid department'),
    
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, dots, and hyphens'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  handleValidationErrors
];

// RFID scan validation rules
const validateRFIDScan = [
  body('rfidTag')
    .trim()
    .isLength({ min: 4, max: 50 })
    .withMessage('RFID Tag must be between 4 and 50 characters'),
    
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO date'),
    
  handleValidationErrors
];

// GPS update validation rules
const validateGPSUpdate = [
  body('studentId')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),
    
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
    
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
    
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO date'),
    
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
    
  handleValidationErrors
];

// Admin creation validation rules
const validateAdmin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, dots, and hyphens'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email must be a valid email address'),
    
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
    
  body('role')
    .optional()
    .isIn(['admin', 'security', 'teacher', 'principal'])
    .withMessage('Role must be admin, security, teacher, or principal'),
    
  handleValidationErrors
];

module.exports = {
  validateStudent,
  validateLogin,
  validateRFIDScan,
  validateGPSUpdate,
  validateAdmin,
  handleValidationErrors
};