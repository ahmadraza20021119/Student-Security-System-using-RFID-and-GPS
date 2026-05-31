const express = require('express');
const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');
const { auth, checkPermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

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
 * Helper function to format date as "YYYY-MM-DD"
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper function to add days to a date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ✅ Mark attendance when student scans RFID
router.post('/mark', asyncHandler(async (req, res) => {
  const { rfidTag } = req.body;

  if (!rfidTag) {
    return res.status(400).json({
      success: false,
      message: 'RFID Tag is required'
    });
  }

  const student = await Student.findOne({ rfidTag, isActive: true });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  const date = formatDate(new Date());
  const time = formatTime(new Date());

  // Prevent double marking for same day
  const existingRecord = await AttendanceRecord.findOne({ rfidTag, date });
  if (existingRecord) {
    return res.status(200).json({
      success: true,
      message: 'Already marked present today',
      record: existingRecord
    });
  }

  // Update student's presence
  student.isPresent = true;
  await student.save();

  // Create attendance record
  const newRecord = await AttendanceRecord.create({
    studentId: student._id,
    studentName: student.name,
    rfidTag: student.rfidTag,
    date,
    status: 'Present',
    time
  });

  res.status(200).json({
    success: true,
    message: 'Attendance marked successfully',
    data: newRecord
  });
}));

// ✅ Get attendance for specific date
router.get('/:date', auth, checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { date } = req.params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  const records = await AttendanceRecord.find({ date })
    .populate('studentId', 'name studentId rfidTag section department')
    .sort({ studentName: 1 });

  // Get all students to show absent ones
  const allStudents = await Student.find({ isActive: true })
    .select('_id name studentId rfidTag section department');

  // Create a map of present students
  const presentStudentIds = new Set(records.map(r => r.studentId._id.toString()));

  // Create complete list including absent students
  const completeList = [];
  
  // Add present students
  records.forEach(record => {
    completeList.push({
      _id: record._id,
      studentId: record.studentId,
      studentName: record.studentName,
      rfidTag: record.rfidTag,
      date: record.date,
      status: record.status,
      time: record.time,
      timestamp: record.createdAt
    });
  });

  // Add absent students
  allStudents.forEach(student => {
    if (!presentStudentIds.has(student._id.toString())) {
      completeList.push({
        _id: `absent-${student._id}`,
        studentId: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          rfidTag: student.rfidTag,
          section: student.section,
          department: student.department
        },
        studentName: student.name,
        rfidTag: student.rfidTag,
        date: date,
        status: 'Absent',
        time: 'Not Scanned',
        timestamp: null
      });
    }
  });

  // Sort by status (Present first), then by name
  completeList.sort((a, b) => {
    if (a.status === 'Present' && b.status === 'Absent') return -1;
    if (a.status === 'Absent' && b.status === 'Present') return 1;
    return a.studentName.localeCompare(b.studentName);
  });

  // Calculate statistics
  const totalStudents = allStudents.length;
  const presentCount = records.length;
  const absentCount = totalStudents - presentCount;

  res.status(200).json({
    success: true,
    data: {
      date,
      totalStudents,
      presentCount,
      absentCount,
      attendancePercentage: totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : 0,
      records: completeList
    }
  });
}));

// ✅ Get attendance history of specific student
router.get('/student/:id', auth, checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify student exists
  const student = await Student.findById(id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  const records = await AttendanceRecord.find({ studentId: id }).sort({ date: -1 });

  // Calculate statistics
  const totalDays = records.length;
  const presentDays = records.filter(r => r.status === 'Present').length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    data: {
      student: {
        _id: student._id,
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
      records
    }
  });
}));

// ✅ Reset attendance daily (will be called by cron job)
router.post('/reset', auth, checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  const today = formatDate(new Date());
  const yesterday = formatDate(addDays(new Date(), -1));
  
  const students = await Student.find({ isActive: true });

  let absentCount = 0;

  // Mark absent students who didn't scan yesterday
  for (const student of students) {
    // Check if student has a "Present" record for yesterday
    const yesterdayRecord = await AttendanceRecord.findOne({
      rfidTag: student.rfidTag,
      date: yesterday,
      status: 'Present'
    });

    // If no present record, create absent record for yesterday
    if (!yesterdayRecord) {
      const absentRecord = await AttendanceRecord.findOne({
        rfidTag: student.rfidTag,
        date: yesterday,
        status: 'Absent'
      });

      if (!absentRecord) {
        await AttendanceRecord.create({
          studentId: student._id,
          studentName: student.name,
          rfidTag: student.rfidTag,
          date: yesterday,
          status: 'Absent',
          time: 'Not Scanned'
        });
        absentCount++;
      }
    }

    // Reset isPresent for next day
    student.isPresent = false;
    await student.save();
  }

  res.status(200).json({
    success: true,
    message: 'Daily attendance reset complete',
    data: {
      resetDate: today,
      studentsReset: students.length,
      absentRecordsCreated: absentCount
    }
  });
}));

module.exports = router;


