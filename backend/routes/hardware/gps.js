const express = require('express');
const Location = require('../../models/Location');
const { validateGPSUpdate } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

// @desc    Process GPS update from hardware
// @route   POST /api/gps/update
// @access  Public (Hardware endpoint)
router.post('/update', validateGPSUpdate, asyncHandler(async (req, res) => {
  const { studentId, latitude, longitude, timestamp, accuracy } = req.body;
  
  await Location.findOneAndUpdate(
    { studentId },
    {
      studentId,
      coordinates: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      timestamp: timestamp || new Date(),
      accuracy: accuracy || 0
    },
    { upsert: true, new: true }
  );
  
  res.json({
    success: true,
    message: 'GPS location updated successfully'
  });
}));

module.exports = router;