const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');
const { STATUS_CODES } = require('../utils/constants');

/**
 * Helper function to format time as "HH:MM AM/PM"
 */
const formatTime = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

/**
 * Mark attendance when RFID is scanned
 */
const markAttendance = async (req, res) => {
  try {
    const { rfidTag } = req.body;

    if (!rfidTag) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'RFID Tag is required'
      });
    }

    // Find student by RFID tag
    const student = await Student.findOne({ rfidTag, isActive: true });

    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Student not found with this RFID tag'
      });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const formattedTime = formatTime(now);

    // Check if attendance already recorded for today
    let attendanceRecord = await AttendanceRecord.findOne({
      studentId: student._id,
      date: today
    });

    if (attendanceRecord) {
      // Already marked, return success
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: `Student ${student.name} attendance already recorded for today.`,
        data: attendanceRecord
      });
    }

    // Create new attendance record
    attendanceRecord = await AttendanceRecord.create({
      studentId: student._id,
      studentName: student.name,
      rfidTag: student.rfidTag,
      date: today,
      status: 'Present',
      time: formattedTime
    });

    // Update student's isPresent field
    student.isPresent = true;
    await student.save();

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: `Student ${student.name} marked present via RFID. Welcome!`,
      data: attendanceRecord
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error marking attendance'
    });
  }
};

/**
 * Get all attendance records for a specific date
 */
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get all active students
    const allStudents = await Student.find({ isActive: true })
      .select('_id name rfidTag section department');

    // Get attendance records for the specific date
    const attendanceRecords = await AttendanceRecord.find({ date })
      .populate('studentId', 'name rfidTag section department')
      .lean();

    // Create a map of student attendance
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      const studentId = record.studentId._id.toString();
      attendanceMap.set(studentId, record);
    });

    // Create complete attendance list with all students
    const completeAttendance = allStudents.map(student => {
      const studentId = student._id.toString();
      const attendanceRecord = attendanceMap.get(studentId);
      
      if (attendanceRecord) {
        return {
          ...attendanceRecord,
          studentId: student.toObject()
        };
      } else {
        // Student is absent (no attendance record for this date)
        return {
          _id: `absent-${studentId}`,
          studentId: student.toObject(),
          studentName: student.name,
          rfidTag: student.rfidTag,
          date: date,
          status: 'Absent',
          time: 'Not Scanned'
        };
      }
    });

    // Sort by status (Present first, then Absent) and then by name
    completeAttendance.sort((a, b) => {
      if (a.status === 'Present' && b.status === 'Absent') return -1;
      if (a.status === 'Absent' && b.status === 'Present') return 1;
      return a.studentName.localeCompare(b.studentName);
    });

    // Calculate statistics
    const totalStudents = allStudents.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = totalStudents - presentCount;

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        date,
        totalStudents,
        presentCount,
        absentCount,
        attendancePercentage: totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : 0,
        attendance: completeAttendance
      }
    });

  } catch (error) {
    console.error('Get attendance by date error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching attendance records'
    });
  }
};

/**
 * Get attendance history for a specific student
 */
const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify student exists
    const student = await Student.findById(id);
    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all attendance records for this student
    const attendanceRecords = await AttendanceRecord.find({ studentId: id })
      .sort({ date: -1 }); // Most recent first

    // Calculate statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          studentId: student.studentId,
          rfidTag: student.rfidTag,
          section: student.section,
          department: student.department
        },
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage
        },
        history: attendanceRecords
      }
    });

  } catch (error) {
    console.error('Get student attendance history error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching student attendance history'
    });
  }
};

/**
 * Manual reset daily attendance
 */
const resetDailyAttendance = async (req, res) => {
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all active students
    const allStudents = await Student.find({ isActive: true });
    let absentCount = 0;

    // For each student, check if they have an attendance record for yesterday
    for (const student of allStudents) {
      const attendanceRecord = await AttendanceRecord.findOne({
        studentId: student._id,
        date: yesterdayStr,
        status: 'Present'
      });

      // If no attendance record exists, create an absent record
      if (!attendanceRecord) {
        await AttendanceRecord.create({
          studentId: student._id,
          studentName: student.name,
          rfidTag: student.rfidTag,
          date: yesterdayStr,
          status: 'Absent',
          time: 'Not Scanned'
        });
        absentCount++;
      }
    }

    // Reset all active students' isPresent field to false
    const resetResult = await Student.updateMany(
      { isActive: true },
      { isPresent: false }
    );

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Daily attendance reset completed',
      data: {
        modifiedCount: resetResult.modifiedCount,
        absentRecordsCreated: absentCount,
        date: yesterdayStr
      }
    });

  } catch (error) {
    console.error('Reset daily attendance error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error resetting daily attendance'
    });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendanceHistory,
  resetDailyAttendance
};




