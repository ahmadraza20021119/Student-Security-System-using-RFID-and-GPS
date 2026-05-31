const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Location = require('../models/Location');

/**
 * Generate PDF report for attendance
 * @param {Object} options - Report options
 * @param {Date} options.startDate - Start date for report
 * @param {Date} options.endDate - End date for report
 * @param {String} options.type - Report type (attendance, students, locations)
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateAttendancePDF = async (options) => {
  const { startDate, endDate, studentId } = options;

  return new Promise(async (resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Buffer to store PDF
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Build query
      let query = {};
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (studentId) {
        query.studentId = studentId;
      }

      // Fetch attendance data
      const attendanceRecords = await Attendance.find(query)
        .populate('studentId', 'name studentId class section')
        .sort({ timestamp: -1 })
        .lean();

      // Header
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('Attendance Report', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      if (startDate && endDate) {
        doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 
                { align: 'center' });
      }

      doc.moveDown(2);

      // Summary Statistics
      const totalRecords = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
      const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

      doc.fontSize(12)
         .fillColor('#111827')
         .text('Summary Statistics', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor('#374151')
         .text(`Total Records: ${totalRecords}`)
         .text(`Present: ${presentCount}`)
         .text(`Late: ${lateCount}`)
         .text(`Absent: ${absentCount}`);

      doc.moveDown(2);

      // Table Header
      doc.fontSize(12)
         .fillColor('#111827')
         .text('Attendance Records', { underline: true });
      
      doc.moveDown(0.5);

      // Table
      const tableTop = doc.y;
      const tableHeaders = ['Date', 'Time', 'Student', 'Class', 'Status'];
      const columnWidths = [80, 60, 150, 80, 80];
      let currentX = 50;

      // Draw table headers
      doc.fontSize(9)
         .fillColor('#1f2937')
         .font('Helvetica-Bold');

      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, tableTop, { width: columnWidths[i] });
        currentX += columnWidths[i];
      });

      // Draw header line
      doc.moveDown(0.3);
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();

      doc.moveDown(0.5);

      // Draw table rows
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#374151');

      attendanceRecords.forEach((record, index) => {
        const y = doc.y;

        // Check if we need a new page
        if (y > 700) {
          doc.addPage();
          doc.y = 50;
        }

        currentX = 50;
        const date = new Date(record.timestamp);
        const rowData = [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          record.studentId?.name || 'N/A',
          `${record.studentId?.class || 'N/A'}-${record.studentId?.section || 'N/A'}`,
          record.status
        ];

        rowData.forEach((data, i) => {
          doc.text(data, currentX, y, { 
            width: columnWidths[i],
            ellipsis: true 
          });
          currentX += columnWidths[i];
        });

        doc.moveDown(0.8);

        // Draw row separator line (every 5 rows)
        if ((index + 1) % 5 === 0) {
          doc.strokeColor('#e5e7eb')
             .lineWidth(0.5)
             .moveTo(50, doc.y)
             .lineTo(550, doc.y)
             .stroke();
          doc.moveDown(0.5);
        }
      });

      // Footer
      const pageCount = doc.bufferedPageRange();
      for (let i = 0; i < pageCount.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#9ca3af')
           .text(
             `Page ${i + 1} of ${pageCount.count} | Student Security System`,
             50,
             750,
             { align: 'center' }
           );
      }

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF report for students
 * @param {Object} options - Report options
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateStudentsPDF = async (options) => {
  const { class: studentClass, section } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: 'landscape'
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Build query
      let query = { isActive: true };
      if (studentClass) query.class = studentClass;
      if (section) query.section = section;

      // Fetch students
      const students = await Student.find(query)
        .sort({ class: 1, section: 1, rollNumber: 1 })
        .lean();

      // Header
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('Students List', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      if (studentClass && section) {
        doc.text(`Class: ${studentClass}-${section}`, { align: 'center' });
      }

      doc.moveDown(2);

      // Summary
      doc.fontSize(12)
         .fillColor('#111827')
         .text(`Total Students: ${students.length}`);

      doc.moveDown(1.5);

      // Table Header
      const tableHeaders = ['S.No', 'Student ID', 'Name', 'Class', 'Roll No', 'Parent', 'Contact', 'Blood Group'];
      const columnWidths = [40, 70, 120, 50, 50, 100, 90, 70];
      let currentX = 50;
      const tableTop = doc.y;

      doc.fontSize(9)
         .fillColor('#1f2937')
         .font('Helvetica-Bold');

      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, tableTop, { width: columnWidths[i] });
        currentX += columnWidths[i];
      });

      doc.moveDown(0.3);
      doc.strokeColor('#d1d5db')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(750, doc.y)
         .stroke();

      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#374151');

      students.forEach((student, index) => {
        const y = doc.y;

        if (y > 500) {
          doc.addPage();
          doc.y = 50;
        }

        currentX = 50;
        const rowData = [
          (index + 1).toString(),
          student.studentId,
          student.name,
          `${student.class}-${student.section}`,
          student.rollNumber,
          student.parentName,
          student.parentContact,
          student.bloodGroup
        ];

        rowData.forEach((data, i) => {
          doc.text(data, currentX, y, { 
            width: columnWidths[i],
            ellipsis: true 
          });
          currentX += columnWidths[i];
        });

        doc.moveDown(0.8);

        if ((index + 1) % 5 === 0) {
          doc.strokeColor('#e5e7eb')
             .lineWidth(0.5)
             .moveTo(50, doc.y)
             .lineTo(750, doc.y)
             .stroke();
          doc.moveDown(0.5);
        }
      });

      // Footer
      const pageCount = doc.bufferedPageRange();
      for (let i = 0; i < pageCount.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#9ca3af')
           .text(
             `Page ${i + 1} of ${pageCount.count} | Student Security System`,
             50,
             550,
             { align: 'center' }
           );
      }

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate CSV report for attendance
 * @param {Object} options - Report options
 * @returns {Promise<String>} - Path to CSV file
 */
const generateAttendanceCSV = async (options) => {
  const { startDate, endDate, studentId } = options;
  
  try {
    // Build query
    let query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (studentId) {
      query.studentId = studentId;
    }

    // Fetch attendance data
    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'name studentId class section rollNumber parentContact')
      .sort({ timestamp: -1 })
      .lean();

    // Create CSV file path
    const filename = `attendance_${Date.now()}.csv`;
    const filepath = path.join(__dirname, '..', 'uploads', filename);

    // Define CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'time', title: 'Time' },
        { id: 'studentId', title: 'Student ID' },
        { id: 'studentName', title: 'Student Name' },
        { id: 'class', title: 'Class' },
        { id: 'section', title: 'Section' },
        { id: 'rollNumber', title: 'Roll Number' },
        { id: 'status', title: 'Status' },
        { id: 'entryType', title: 'Entry Type' },
        { id: 'location', title: 'Location' },
        { id: 'parentContact', title: 'Parent Contact' },
        { id: 'notes', title: 'Notes' }
      ]
    });

    // Format data for CSV
    const records = attendanceRecords.map(record => {
      const date = new Date(record.timestamp);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        studentId: record.studentId?.studentId || 'N/A',
        studentName: record.studentId?.name || record.studentName,
        class: record.studentId?.class || 'N/A',
        section: record.studentId?.section || 'N/A',
        rollNumber: record.studentId?.rollNumber || 'N/A',
        status: record.status,
        entryType: record.entryType,
        location: record.location || 'N/A',
        parentContact: record.studentId?.parentContact || 'N/A',
        notes: record.notes || ''
      };
    });

    // Write CSV file
    await csvWriter.writeRecords(records);

    return filepath;

  } catch (error) {
    throw error;
  }
};

/**
 * Generate CSV report for students
 * @param {Object} options - Report options
 * @returns {Promise<String>} - Path to CSV file
 */
const generateStudentsCSV = async (options) => {
  const { class: studentClass, section } = options;

  try {
    // Build query
    let query = { isActive: true };
    if (studentClass) query.class = studentClass;
    if (section) query.section = section;

    // Fetch students
    const students = await Student.find(query)
      .sort({ class: 1, section: 1, rollNumber: 1 })
      .lean();

    // Create CSV file path
    const filename = `students_${Date.now()}.csv`;
    const filepath = path.join(__dirname, '..', 'uploads', filename);

    // Define CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'studentId', title: 'Student ID' },
        { id: 'name', title: 'Name' },
        { id: 'rfidTag', title: 'RFID Tag' },
        { id: 'class', title: 'Class' },
        { id: 'section', title: 'Section' },
        { id: 'rollNumber', title: 'Roll Number' },
        { id: 'dateOfBirth', title: 'Date of Birth' },
        { id: 'gender', title: 'Gender' },
        { id: 'bloodGroup', title: 'Blood Group' },
        { id: 'parentName', title: 'Parent Name' },
        { id: 'parentContact', title: 'Parent Contact' },
        { id: 'parentEmail', title: 'Parent Email' },
        { id: 'address', title: 'Address' },
        { id: 'emergencyContact', title: 'Emergency Contact' },
        { id: 'medicalConditions', title: 'Medical Conditions' },
        { id: 'enrollmentDate', title: 'Enrollment Date' }
      ]
    });

    // Format data for CSV
    const records = students.map(student => ({
      studentId: student.studentId,
      name: student.name,
      rfidTag: student.rfidTag,
      class: student.class,
      section: student.section,
      rollNumber: student.rollNumber,
      dateOfBirth: new Date(student.dateOfBirth).toLocaleDateString(),
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      parentName: student.parentName,
      parentContact: student.parentContact,
      parentEmail: student.parentEmail,
      address: student.address,
      emergencyContact: student.emergencyContact,
      medicalConditions: student.medicalConditions || '',
      enrollmentDate: new Date(student.enrollmentDate).toLocaleDateString()
    }));

    // Write CSV file
    await csvWriter.writeRecords(records);

    return filepath;

  } catch (error) {
    throw error;
  }
};

/**
 * Generate location history CSV
 * @param {Object} options - Report options
 * @returns {Promise<String>} - Path to CSV file
 */
const generateLocationCSV = async (options) => {
  const { startDate, endDate, studentId } = options;

  try {
    // Build query
    let query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (studentId) {
      query.studentId = studentId;
    }

    // Fetch location data
    const locations = await Location.find(query)
      .populate('studentId', 'name studentId class section')
      .sort({ timestamp: -1 })
      .lean();

    // Create CSV file path
    const filename = `locations_${Date.now()}.csv`;
    const filepath = path.join(__dirname, '..', 'uploads', filename);

    // Define CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'studentId', title: 'Student ID' },
        { id: 'studentName', title: 'Student Name' },
        { id: 'class', title: 'Class' },
        { id: 'latitude', title: 'Latitude' },
        { id: 'longitude', title: 'Longitude' },
        { id: 'accuracy', title: 'Accuracy (meters)' },
        { id: 'isInSchoolZone', title: 'In School Zone' }
      ]
    });

    // Format data for CSV
    const records = locations.map(location => ({
      timestamp: new Date(location.timestamp).toLocaleString(),
      studentId: location.studentId?.studentId || 'N/A',
      studentName: location.studentId?.name || 'N/A',
      class: location.studentId ? `${location.studentId.class}-${location.studentId.section}` : 'N/A',
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      accuracy: location.accuracy || 'N/A',
      isInSchoolZone: location.isInSchoolZone ? 'Yes' : 'No'
    }));

    // Write CSV file
    await csvWriter.writeRecords(records);

    return filepath;

  } catch (error) {
    throw error;
  }
};

/**
 * Delete temporary report file
 * @param {String} filepath - Path to file
 */
const deleteReportFile = (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error deleting report file:', error);
  }
};

module.exports = {
  generateAttendancePDF,
  generateStudentsPDF,
  generateAttendanceCSV,
  generateStudentsCSV,
  generateLocationCSV,
  deleteReportFile
};