const express = require('express');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Location = require('../models/Location');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @desc    Simulate RFID scan
// @route   POST /api/simulate/rfid
// @access  Private
router.post('/rfid', asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  
  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({ 
      success: false, 
      message: 'Student not found' 
    });
  }

  const attendance = new Attendance({
    studentId: student._id,
    studentName: student.name,
    timestamp: new Date(),
    status: 'present',
    entryType: 'simulation'
  });

  await attendance.save();
  
  res.json({
    success: true,
    message: `Simulated RFID scan for ${student.name}`,
    data: attendance
  });
}));

// @desc    Simulate GPS update
// @route   POST /api/simulate/gps
// @access  Private
router.post('/gps', asyncHandler(async (req, res) => {
  const { studentId, latitude, longitude } = req.body;
  
  await Location.findOneAndUpdate(
    { studentId },
    {
      studentId,
      coordinates: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      timestamp: new Date()
    },
    { upsert: true, new: true }
  );
  
  res.json({
    success: true,
    message: 'GPS location simulated successfully'
  });
}));

module.exports = router;