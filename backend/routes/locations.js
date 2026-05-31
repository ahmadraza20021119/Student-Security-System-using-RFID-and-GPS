const express = require('express');
const Location = require('../models/Location');
const Student = require('../models/Student');
const { auth, checkPermission } = require('../middleware/auth');
const { validateGPSUpdate } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private
router.get('/', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const locations = await Location.find()
    .populate('studentId', 'name studentId class section')
    .sort({ timestamp: -1 });
  
  res.json({
    success: true,
    count: locations.length,
    data: locations
  });
}));

// @desc    Update student location
// @route   POST /api/locations
// @access  Private (Hardware endpoint)
router.post('/', validateGPSUpdate, asyncHandler(async (req, res) => {
  const { studentId, latitude, longitude, timestamp, accuracy } = req.body;
  
  await Location.findOneAndUpdate(
    { studentId },
    {
      studentId,
      coordinates: { latitude, longitude },
      timestamp: timestamp || new Date(),
      accuracy: accuracy || 0
    },
    { upsert: true, new: true }
  );
  
  res.json({
    success: true,
    message: 'Location updated successfully'
  });
}));

module.exports = router;