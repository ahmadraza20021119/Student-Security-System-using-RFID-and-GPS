const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendanceHistory,
  resetDailyAttendance
} = require('../controllers/attendanceRecordController');
const { auth, checkPermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Mark attendance when RFID is scanned
// @route   POST /api/attendance-records/mark
// @access  Public (for RFID hardware)
router.post('/mark', asyncHandler(markAttendance));

// @desc    Get all attendance records for a specific date
// @route   GET /api/attendance-records/:date
// @access  Private (requires canViewReports permission)
router.get('/:date', auth, checkPermission('canViewReports'), asyncHandler(getAttendanceByDate));

// @desc    Get attendance history for a specific student
// @route   GET /api/attendance-records/student/:id
// @access  Private (requires canViewReports permission)
router.get('/student/:id', auth, checkPermission('canViewReports'), asyncHandler(getStudentAttendanceHistory));

// @desc    Manual reset daily attendance
// @route   POST /api/attendance-records/reset
// @access  Private (requires canManageStudents permission)
router.post('/reset', auth, checkPermission('canManageStudents'), asyncHandler(resetDailyAttendance));

module.exports = router;




