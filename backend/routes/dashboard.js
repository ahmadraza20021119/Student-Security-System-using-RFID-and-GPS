const express = require('express');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { auth, checkPermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get total active students
  const totalStudents = await Student.countDocuments({ isActive: true });
  
  // Get attendance records for today, but only for students that still exist
  const attendanceToday = await Attendance.find({
    date: today,
    status: 'present'
  }).populate('studentId', '_id');
  
  // Filter out attendance records for deleted students
  const validAttendanceToday = attendanceToday.filter(att => att.studentId !== null);
  const presentCount = validAttendanceToday.length;
  
  // Calculate absent count
  const absentCount = totalStudents > 0 ? totalStudents - presentCount : 0;
  
  res.json({
    totalStudents,
    presentToday: presentCount,
    absentToday: absentCount
  });
}));

// @desc    Clean up orphaned attendance records
// @route   POST /api/dashboard/cleanup
// @access  Private
router.post('/cleanup', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  try {
    // Find all attendance records
    const allAttendance = await Attendance.find({});
    
    // Get all active student IDs
    const activeStudents = await Student.find({ isActive: true }).select('_id');
    const activeStudentIds = new Set(activeStudents.map(s => s._id.toString()));
    
    // Find orphaned attendance records
    const orphanedRecords = allAttendance.filter(att => 
      !activeStudentIds.has(att.studentId.toString())
    );
    
    // Delete orphaned records
    if (orphanedRecords.length > 0) {
      const orphanedIds = orphanedRecords.map(att => att._id);
      await Attendance.deleteMany({ _id: { $in: orphanedIds } });
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${orphanedRecords.length} orphaned attendance records`,
      deletedCount: orphanedRecords.length
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed'
    });
  }
}));

// @desc    Reset all students' isPresent status to false (for new day)
// @route   POST /api/dashboard/reset-attendance
// @access  Private
router.post('/reset-attendance', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Reset all active students' isPresent field to false
    const studentUpdateResult = await Student.updateMany(
      { isActive: true },
      { isPresent: false }
    );
    
    // 2. Delete all attendance records for today
    // We check both 'date' field (used by some parts) and 'timestamp' range (used by others) to be safe
    const attendanceDeleteResult = await Attendance.deleteMany({
      $or: [
        { date: today },
        { timestamp: { $gte: today, $lt: tomorrow } }
      ]
    });

    res.json({
      success: true,
      message: `Reset attendance status for ${studentUpdateResult.modifiedCount} students and deleted ${attendanceDeleteResult.deletedCount} attendance records`,
      modifiedCount: studentUpdateResult.modifiedCount,
      deletedCount: attendanceDeleteResult.deletedCount
    });
    
  } catch (error) {
    console.error('Reset attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Reset attendance failed'
    });
  }
}));

// @desc    Get attendance history by date range
// @route   GET /api/dashboard/attendance-history
// @access  Private
router.get('/attendance-history', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, studentId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let query = {
      date: { $gte: start, $lte: end }
    };

    if (studentId) {
      query.studentId = studentId;
    }

    const attendanceHistory = await Attendance.find(query)
      .populate('studentId', 'name studentId section')
      .sort({ date: -1, timestamp: -1 });

    // Group by date for better organization
    const groupedByDate = {};
    attendanceHistory.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(record);
    });

    res.json({
      success: true,
      data: {
        attendanceHistory,
        groupedByDate,
        totalRecords: attendanceHistory.length,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history'
    });
  }
}));

module.exports = router;