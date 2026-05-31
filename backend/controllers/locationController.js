const Location = require('../models/Location');
const Student = require('../models/Student');
const { MESSAGES, STATUS_CODES, SCHOOL_BOUNDS } = require('../utils/constants');

/**
 * Get all student locations
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find()
      .populate('studentId', 'name studentId class section')
      .sort({ timestamp: -1 });
    
    res.status(STATUS_CODES.OK).json({
      success: true,
      count: locations.length,
      data: locations
    });

  } catch (error) {
    console.error('Get all locations error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get location by student ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getLocationByStudentId = async (req, res) => {
  try {
    const location = await Location.findOne({ studentId: req.params.studentId })
      .populate('studentId', 'name studentId class section');

    if (!location) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Location not found for this student'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: location
    });

  } catch (error) {
    console.error('Get location by student ID error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Update student location (from GPS hardware)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateLocation = async (req, res) => {
  try {
    const { studentId, latitude, longitude, timestamp, accuracy } = req.body;
    
    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student || !student.isActive) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Student not found or inactive'
      });
    }

    // Check if location is within school bounds
    const isInSchoolZone = checkIfInSchoolZone(latitude, longitude);

    // Update or create location record
    const location = await Location.findOneAndUpdate(
      { studentId },
      {
        studentId,
        coordinates: { 
          latitude: parseFloat(latitude), 
          longitude: parseFloat(longitude) 
        },
        timestamp: timestamp || new Date(),
        accuracy: accuracy || 0,
        isInSchoolZone
      },
      { upsert: true, new: true }
    ).populate('studentId', 'name studentId class section');
    
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get location history for a student
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getLocationHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { days = 7 } = req.query;

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

    // For now, we only store latest location
    // In a full implementation, you might have a LocationHistory model
    const location = await Location.findOne({ 
      studentId,
      timestamp: { $gte: daysAgo }
    }).populate('studentId', 'name studentId class section');

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
        currentLocation: location || null
      }
    });

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get students near a location (geospatial query)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentsNearLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.query; // radius in meters

    if (!latitude || !longitude) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Find locations within radius
    const locations = await Location.find({
      'coordinates.latitude': {
        $gte: parseFloat(latitude) - (radius / 111000), // 1 degree ≈ 111km
        $lte: parseFloat(latitude) + (radius / 111000)
      },
      'coordinates.longitude': {
        $gte: parseFloat(longitude) - (radius / (111000 * Math.cos(latitude * Math.PI / 180))),
        $lte: parseFloat(longitude) + (radius / (111000 * Math.cos(latitude * Math.PI / 180)))
      }
    }).populate('studentId', 'name studentId class section');

    res.status(STATUS_CODES.OK).json({
      success: true,
      count: locations.length,
      data: locations
    });

  } catch (error) {
    console.error('Get students near location error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Get students outside school zone
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentsOutsideSchoolZone = async (req, res) => {
  try {
    const locations = await Location.find({ isInSchoolZone: false })
      .populate('studentId', 'name studentId class section parentContact')
      .sort({ timestamp: -1 });

    res.status(STATUS_CODES.OK).json({
      success: true,
      count: locations.length,
      data: locations
    });

  } catch (error) {
    console.error('Get students outside school zone error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Delete location record
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: MESSAGES.ERROR.NOT_FOUND
      });
    }

    await location.deleteOne();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.DELETED,
      data: {}
    });

  } catch (error) {
    console.error('Delete location error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR
    });
  }
};

/**
 * Helper function to check if coordinates are within school bounds
 * @param {Number} latitude - Latitude coordinate
 * @param {Number} longitude - Longitude coordinate
 * @returns {Boolean} - True if within school zone
 */
const checkIfInSchoolZone = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  return (
    lat >= SCHOOL_BOUNDS.SOUTH &&
    lat <= SCHOOL_BOUNDS.NORTH &&
    lng >= SCHOOL_BOUNDS.WEST &&
    lng <= SCHOOL_BOUNDS.EAST
  );
};

module.exports = {
  getAllLocations,
  getLocationByStudentId,
  updateLocation,
  getLocationHistory,
  getStudentsNearLocation,
  getStudentsOutsideSchoolZone,
  deleteLocation
};