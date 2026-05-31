const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { MESSAGES, STATUS_CODES, PAGINATION } = require('../utils/constants');

/**
 * Get all attendance records with filters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllAttendance = async (req, res) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
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

    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    if (entryType) query.entryType = entryType;

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

    res.status(STATUS_CODES.OK).json({
      success: true,
      count: attendance.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: attendance
    });

  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get attendance record by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('studentId', 'name studentId class section');

    if (!attendance) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: attendance
    });

  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Create manual attendance entry
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createAttendance = async (req, res) => {
  try {
    const { studentId, status = 'present', notes = '', location = 'Manual Entry' } = req.body;

    if (!studentId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student || !student.isActive) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
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
      return res.status(STATUS_CODES.CONFLICT).json({
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

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.CREATED,
      data: populatedAttendance
    });

  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Update attendance record
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateAttendance = async (req, res) => {
  try {
    const { status, notes, location } = req.body;

    let attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Update fields
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;
    if (location) attendance.location = location;

    attendance = await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'name studentId class section');

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.UPDATED,
      data: populatedAttendance
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Delete attendance record
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    await attendance.deleteOne();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.DELETED,
      data: {}
    });

  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get daily attendance summary
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDailySummary = async (req, res) => {
  try {
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

    res.status(STATUS_CODES.OK).json({
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

  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get attendance statistics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAttendanceStats = async (req, res) => {
  try {
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

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        period: `${days} days`,
        totalRecords,
        statusBreakdown,
        dailyTrend,
        entryTypeBreakdown
      }
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get student attendance history
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { days = 30 } = req.query;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
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

    res.status(STATUS_CODES.OK).json({
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

  } catch (error) {
    console.error('Get student history error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Mark student present by RFID tag
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const markPresentByRfid = async (req, res) => {
  try {
    const { rfidTag } = req.body;

    if (!rfidTag) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'RFID Tag is required'
      });
    }

    const student = await Student.findOne({ rfidTag, isActive: true });

    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Student not found with this RFID tag'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let attendance = await Attendance.findOne({
      studentId: student._id,
      date: today
    });

    if (attendance) {
      // If an attendance record exists for today, update it to present if it's not already
      if (attendance.status !== 'present') {
        attendance.status = 'present';
        attendance.entryType = 'rfid';
        attendance.timestamp = new Date();
        await attendance.save();
      }
    } else {
      // No attendance record for today, create a new one as present
      attendance = await Attendance.create({
        studentId: student._id,
        studentName: student.name,
        timestamp: new Date(),
        date: today,
        status: 'present',
        entryType: 'rfid'
      });
    }

    // Update student's isPresent field to true
    student.isPresent = true;
    await student.save();

    // Send email notification (non-blocking)
    const { sendAttendanceEmail } = require('../utils/emailService');
    sendAttendanceEmail(student, attendance).catch(err => 
      console.error('Failed to send attendance email in background:', err)
    );

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'name studentId class section');

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `Student ${student.name} marked present via RFID. Welcome!`,
      data: populatedAttendance
    });

  } catch (error) {
    console.error('Mark present by RFID error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

module.exports = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getDailySummary,
  getAttendanceStats,
  getStudentHistory,
  markPresentByRfid
};