const express = require('express');
const Student = require('../../models/Student');
const Attendance = require('../../models/Attendance');
const { validateRFIDScan } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

// @desc    Process RFID scan from hardware
// @route   POST /api/rfid/scan
// @access  Public (Hardware endpoint)
router.post('/scan', validateRFIDScan, asyncHandler(async (req, res) => {
  const { rfidTag, timestamp } = req.body;
  
  const student = await Student.findOne({ rfidTag });
  if (!student) {
    return res.status(404).json({ 
      success: false,
      message: 'Student not found with this RFID tag' 
    });
  }

  const attendance = new Attendance({
    studentId: student._id,
    studentName: student.name,
    timestamp: timestamp || new Date(),
    status: 'present',
    entryType: 'rfid'
  });

  await attendance.save();
  
  res.json({
    success: true,
    message: 'RFID scan processed successfully',
    data: {
      student: student.name,
      timestamp: attendance.timestamp
    }
  });
}));

module.exports = router;