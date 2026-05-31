const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { auth, checkPermission } = require('../middleware/auth');
const { validateRFIDScan } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
router.get('/', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    date,
    studentId,
    status,
    entryType,
    startDate,
    endDate,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = req.query;

  // Build query object
  let query = {};

  // Filter by specific date
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.timestamp = { $gte: startOfDay, $lte: endOfDay };
  }

  // Filter by date range
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.timestamp = { $gte: start, $lte: end };
  }

  // Filter by student
  if (studentId) {
    query.studentId = studentId;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by entry type
  if (entryType) {
    query.entryType = entryType;
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const attendance = await Attendance.find(query)
    .populate('studentId', 'name studentId class section')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await Attendance.countDocuments(query);

  res.json({
    success: true,
    count: attendance.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: attendance
  });
}));

// @desc    Get attendance record by ID
// @route   GET /api/attendance/:id
// @access  Private
router.get('/:id', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate('studentId', 'name studentId class section');

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found'
    });
  }

  res.json({
    success: true,
    data: attendance
  });
}));

// @desc    Manual attendance entry
// @route   POST /api/attendance
// @access  Private
router.post('/', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  const { studentId, status = 'present', notes = '', location = 'Manual Entry' } = req.body;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID is required'
    });
  }

  // Verify student exists
  const student = await Student.findById(studentId);
  if (!student || !student.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Student not found or inactive'
    });
  }

  // Check if already marked present today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingAttendance = await Attendance.findOne({
    studentId,
    timestamp: { $gte: today, $lt: tomorrow }
  });

  if (existingAttendance) {
    return res.status(400).json({
      success: false,
      message: 'Attendance already recorded for this student today'
    });
  }

  const attendance = await Attendance.create({
    studentId,
    studentName: student.name,
    timestamp: new Date(),
    status,
    entryType: 'manual',
    location,
    notes
  });

  const populatedAttendance = await Attendance.findById(attendance._id)
    .populate('studentId', 'name studentId class section');

  res.status(201).json({
    success: true,
    message: 'Attendance recorded successfully',
    data: populatedAttendance
  });
}));

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private
router.put('/:id', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  const { status, notes, location } = req.body;

  let attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found'
    });
  }

  // Update fields
  if (status) attendance.status = status;
  if (notes !== undefined) attendance.notes = notes;
  if (location) attendance.location = location;

  attendance = await attendance.save();

  const populatedAttendance = await Attendance.findById(attendance._id)
    .populate('studentId', 'name studentId class section');

  res.json({
    success: true,
    message: 'Attendance updated successfully',
    data: populatedAttendance
  });
}));

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private
router.delete('/:id', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found'
    });
  }

  await attendance.deleteOne();

  res.json({
    success: true,
    message: 'Attendance record deleted successfully',
    data: {}
  });
}));

// @desc    Get daily attendance summary
// @route   GET /api/attendance/summary/daily
// @access  Private
router.get('/summary/daily', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get total students
  const totalStudents = await Student.countDocuments({ isActive: true });

  // Get attendance for the day
  const attendanceRecords = await Attendance.find({
    timestamp: { $gte: startOfDay, $lte: endOfDay }
  }).populate('studentId', 'name class section');

  // Group by status
  const statusCounts = await Attendance.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const presentCount = statusCounts.find(s => s._id === 'present')?.count || 0;
  const lateCount = statusCounts.find(s => s._id === 'late')?.count || 0;
  const absentCount = totalStudents - presentCount - lateCount;

  // Get class-wise summary
  const classSummary = await Attendance.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $unwind: '$student'
    },
    {
      $group: {
        _id: {
          class: '$student.class',
          section: '$student.section'
        },
        presentCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.class': 1, '_id.section': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      date,
      totalStudents,
      presentCount,
      lateCount,
      absentCount,
      attendancePercentage: totalStudents > 0 ? ((presentCount + lateCount) / totalStudents * 100).toFixed(2) : 0,
      classSummary,
      recentEntries: attendanceRecords.slice(0, 10)
    }
  });
}));

// @desc    Get monthly attendance summary for all students (or specific student)
// @route   GET /api/attendance/summary/monthly
// @access  Private
router.get('/summary/monthly', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { month, year, studentId } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      message: 'Month and year are required'
    });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const daysInMonth = endDate.getDate();

  // 1. Calculate Standard Working Days (Mon-Fri) and add to a Set
  const workingDaysSet = new Set();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDay = new Date(year, month - 1, day);
    const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Assume Mon(1) to Fri(5) are working days
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDaysSet.add(currentDay.toDateString());
    }
  }

  // 2. Get all attendance for the month (present or late)
  const attendanceRecords = await Attendance.find({
    timestamp: { $gte: startDate, $lte: endDate },
    status: { $in: ['present', 'late'] }
  });

  // 3. Add any distinct recorded dates to the set (handles Saturdays/Sundays if class happened)
  attendanceRecords.forEach(r => {
    workingDaysSet.add(new Date(r.timestamp).toDateString());
  });

  const totalWorkingDays = workingDaysSet.size;

  // 4. Map attendance count per student
  const studentAttendanceCounts = {};
  attendanceRecords.forEach(r => {
    const dateKey = new Date(r.timestamp).toDateString();
    
    if (!studentAttendanceCounts[r.studentId]) {
      studentAttendanceCounts[r.studentId] = new Set();
    }
    studentAttendanceCounts[r.studentId].add(dateKey);
  });

  // Build query for students
  const studentQuery = { isActive: true };
  if (studentId) {
    studentQuery._id = studentId;
  }

  // Get active students (filtered if studentId is provided)
  const students = await Student.find(studentQuery)
    .select('name studentId section class department')
    .sort({ class: 1, section: 1, name: 1 });

  // Compile report
  const report = students.map(student => {
    const presentDaysSet = studentAttendanceCounts[student._id] || new Set();
    const presentDays = presentDaysSet.size;
    
    let percentage = 0;
    if (totalWorkingDays > 0) {
      percentage = ((presentDays / totalWorkingDays) * 100).toFixed(1);
    }

    return {
      _id: student._id,
      name: student.name,
      studentId: student.studentId,
      section: student.section,
      class: student.class,
      department: student.department || '-',
      presentDays,
      totalWorkingDays,
      percentage
    };
  });

  res.json({
    success: true,
    data: {
      month,
      year,
      totalWorkingDays,
      totalStudents: students.length,
      report
    }
  });
}));

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
router.get('/stats/overview', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days));

  // Total attendance records in period
  const totalRecords = await Attendance.countDocuments({
    timestamp: { $gte: daysAgo }
  });

  // Status breakdown
  const statusBreakdown = await Attendance.aggregate([
    {
      $match: {
        timestamp: { $gte: daysAgo }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Daily attendance trend
  const dailyTrend = await Attendance.aggregate([
    {
      $match: {
        timestamp: { $gte: daysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Entry type breakdown
  const entryTypeBreakdown = await Attendance.aggregate([
    {
      $match: {
        timestamp: { $gte: daysAgo }
      }
    },
    {
      $group: {
        _id: '$entryType',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      period: `${days} days`,
      totalRecords,
      statusBreakdown,
      dailyTrend,
      entryTypeBreakdown
    }
  });
}));

// @desc    Get student attendance history
// @route   GET /api/attendance/student/:studentId/history
// @access  Private
router.get('/student/:studentId/history', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { days = 30 } = req.query;

  // Verify student exists
  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days));

  const attendanceHistory = await Attendance.find({
    studentId,
    timestamp: { $gte: daysAgo }
  }).sort({ timestamp: -1 });

  // Calculate statistics
  const totalDays = parseInt(days);
  const presentDays = attendanceHistory.filter(a => a.status === 'present').length;
  const lateDays = attendanceHistory.filter(a => a.status === 'late').length;
  const attendancePercentage = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        class: student.class,
        section: student.section
      },
      period: `${days} days`,
      statistics: {
        totalDays,
        presentDays,
        lateDays,
        absentDays: totalDays - presentDays - lateDays,
        attendancePercentage
      },
      history: attendanceHistory
    }
  });
}));

module.exports = router;