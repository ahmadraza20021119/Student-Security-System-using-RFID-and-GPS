const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { MESSAGES, STATUS_CODES, PAGINATION } = require('../utils/constants');

/**
 * Get all students with pagination and filters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllStudents = async (req, res) => {
  try {
    const { 
      page = PAGINATION.DEFAULT_PAGE, 
      limit = PAGINATION.DEFAULT_LIMIT, 
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
    if (studentClass) query.class = studentClass;
    if (section) query.section = section;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const students = await Student.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Student.countDocuments(query);

    res.status(STATUS_CODES.OK).json({
      success: true,
      count: students.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: students
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get single student by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Create new student
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createStudent = async (req, res) => {
  try {
    // Check for duplicate studentId and rfidTag
    const existingStudent = await Student.findOne({
      $or: [
        { studentId: req.body.studentId },
        { rfidTag: req.body.rfidTag }
      ]
    });

    if (existingStudent) {
      const field = existingStudent.studentId === req.body.studentId ? 'Student ID' : 'RFID Tag';
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false,
        message: `${field} already exists`
      });
    }

    const student = await Student.create({
      ...req.body,
      enrollmentDate: new Date()
    });

    // Create an initial attendance record for the new student as 'absent'
    await Attendance.create({
      studentId: student._id,
      studentName: student.name,
      status: 'absent',
      entryType: 'manual', // Manually marked as absent upon creation
      timestamp: new Date().setHours(0, 0, 0, 0), // Set to the beginning of the current day
      date: new Date().setHours(0, 0, 0, 0) // Set to the beginning of the current day
    });

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.CREATED,
      data: student
    });

  } catch (error) {
    console.error('Create student error:', error);
    
    if (error.code === 11000) {
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false,
        message: MESSAGES.ERROR.ALREADY_EXISTS
      });
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Update student
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
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
      return res.status(STATUS_CODES.CONFLICT).json({ 
        success: false,
        message: `${field} already exists`
      });
    }

    student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.UPDATED,
      data: student
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Delete student (soft delete)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    // Soft delete - set isActive to false
    student.isActive = false;
    await student.save();

    // Also delete all attendance records for this student
    await Attendance.deleteMany({ studentId: student._id });

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.DELETED,
      data: {}
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Restore deleted student
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const restoreStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    student.isActive = true;
    await student.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.RESTORED,
      data: student
    });

  } catch (error) {
    console.error('Restore student error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get student by RFID tag
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentByRFID = async (req, res) => {
  try {
    const student = await Student.findOne({ 
      rfidTag: req.params.tag,
      isActive: true 
    });

    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ 
        success: false,
        message: 'Student not found with this RFID tag'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Get student by RFID error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get students by class and section
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentsByClass = async (req, res) => {
  try {
    const { class: studentClass, section } = req.params;

    const students = await Student.find({ 
      class: studentClass,
      section: section,
      isActive: true 
    }).sort({ rollNumber: 1 });

    res.status(STATUS_CODES.OK).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get students by class error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get student statistics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentStats = async (req, res) => {
  try {
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

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: {
        totalStudents,
        totalInactive,
        recentEnrollments,
        classCounts,
        genderCounts
      }
    });

  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Bulk import students
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ 
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

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `Bulk import completed. ${results.successful.length} successful, ${results.failed.length} failed, ${results.duplicates.length} duplicates`,
      data: results
    });

  } catch (error) {
    console.error('Bulk import students error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  getStudentByRFID,
  getStudentsByClass,
  getStudentStats,
  bulkImportStudents
};