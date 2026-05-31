const express = require('express');
const Student = require('../models/Student');
const { auth, checkPermission } = require('../middleware/auth');
const { validateStudent } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { markPresentByRfid } = require('../controllers/attendanceController');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @desc    Get all students
// @route   GET /api/students
// @access  Private
router.get('/', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    search = '', 
    class: studentClass = '', 
    section = '',
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  // Build query object
  let query = { isActive: true };

  // Add search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { parentName: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by class and section
  if (studentClass) {
    query.class = studentClass;
  }
  if (section) {
    query.section = section;
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortOptions
  };

  const students = await Student.find(query)
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await Student.countDocuments(query);

  res.json({
    success: true,
    count: students.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: students
  });
}));

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({ 
      success: false,
      message: 'Student not found' 
    });
  }

  res.json({
    success: true,
    data: student
  });
}));

// @desc    Create new student
// @route   POST /api/students
// @access  Private
router.post('/', checkPermission('canManageStudents'), validateStudent, asyncHandler(async (req, res) => {
  // Check for duplicate studentId and rfidTag
  const existingStudent = await Student.findOne({
    $or: [
      { studentId: req.body.studentId },
      { rfidTag: req.body.rfidTag }
    ]
  });

  if (existingStudent) {
    const field = existingStudent.studentId === req.body.studentId ? 'Student ID' : 'RFID Tag';
    return res.status(400).json({ 
      success: false,
      message: `${field} already exists` 
    });
  }

  const student = await Student.create({
    ...req.body,
    enrollmentDate: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student
  });
}));

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
router.put('/:id', checkPermission('canManageStudents'), validateStudent, asyncHandler(async (req, res) => {
  let student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({ 
      success: false,
      message: 'Student not found' 
    });
  }

  // Check for duplicate studentId and rfidTag (excluding current student)
  const existingStudent = await Student.findOne({
    _id: { $ne: req.params.id },
    $or: [
      { studentId: req.body.studentId },
      { rfidTag: req.body.rfidTag }
    ]
  });

  if (existingStudent) {
    const field = existingStudent.studentId === req.body.studentId ? 'Student ID' : 'RFID Tag';
    return res.status(400).json({ 
      success: false,
      message: `${field} already exists` 
    });
  }

  console.log('Update student request:', req.params.id, req.body);
  
  student = await Student.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  console.log('Updated student result:', student);

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: student
  });
}));

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
// @access  Private
router.delete('/:id', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({ 
      success: false,
      message: 'Student not found' 
    });
  }

  // Soft delete - set isActive to false
  student.isActive = false;
  await student.save();

  res.json({
    success: true,
    message: 'Student deleted successfully',
    data: {}
  });
}));

// @desc    Restore deleted student
// @route   PUT /api/students/:id/restore
// @access  Private
router.put('/:id/restore', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({ 
      success: false,
      message: 'Student not found' 
    });
  }

  student.isActive = true;
  await student.save();

  res.json({
    success: true,
    message: 'Student restored successfully',
    data: student
  });
}));

// @desc    Get student by RFID tag
// @route   GET /api/students/rfid/:tag
// @access  Private
router.get('/rfid/:tag', asyncHandler(async (req, res) => {
  const student = await Student.findOne({ 
    rfidTag: req.params.tag,
    isActive: true 
  });

  if (!student) {
    return res.status(404).json({ 
      success: false,
      message: 'Student not found with this RFID tag' 
    });
  }

  res.json({
    success: true,
    data: student
  });
}));

// @desc    Get students by class and section
// @route   GET /api/students/class/:class/section/:section
// @access  Private
router.get('/class/:class/section/:section', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const { class: studentClass, section } = req.params;

  const students = await Student.find({ 
    class: studentClass,
    section: section,
    isActive: true 
  }).sort({ rollNumber: 1 });

  res.json({
    success: true,
    count: students.length,
    data: students
  });
}));

// @desc    Get student statistics
// @route   GET /api/students/stats
// @access  Private
router.get('/stats/overview', checkPermission('canViewReports'), asyncHandler(async (req, res) => {
  const totalStudents = await Student.countDocuments({ isActive: true });
  const totalInactive = await Student.countDocuments({ isActive: false });

  // Group by class
  const classCounts = await Student.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$class', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  // Group by gender
  const genderCounts = await Student.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$gender', count: { $sum: 1 } } }
  ]);

  // Recent enrollments (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentEnrollments = await Student.countDocuments({
    isActive: true,
    enrollmentDate: { $gte: thirtyDaysAgo }
  });

  res.json({
    success: true,
    data: {
      totalStudents,
      totalInactive,
      recentEnrollments,
      classCounts,
      genderCounts
    }
  });
}));

// @desc    Bulk import students
// @route   POST /api/students/bulk-import
// @access  Private
router.post('/bulk-import', checkPermission('canManageStudents'), asyncHandler(async (req, res) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide an array of students' 
    });
  }

  const results = {
    successful: [],
    failed: [],
    duplicates: []
  };

  for (const studentData of students) {
    try {
      // Check for duplicates
      const existing = await Student.findOne({
        $or: [
          { studentId: studentData.studentId },
          { rfidTag: studentData.rfidTag }
        ]
      });

      if (existing) {
        results.duplicates.push({
          studentId: studentData.studentId,
          reason: 'Student ID or RFID Tag already exists'
        });
        continue;
      }

      const student = await Student.create({
        ...studentData,
        enrollmentDate: new Date()
      });

      results.successful.push(student);

    } catch (error) {
      results.failed.push({
        studentData,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    message: `Bulk import completed. ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates`,
    data: results
  });
}));

// @desc    Mark student present by RFID scan
// @route   POST /api/students/rfid/scan
// @access  Private (no specific permission required - students can mark their own attendance)
router.post('/rfid/scan', asyncHandler(markPresentByRfid));

module.exports = router;