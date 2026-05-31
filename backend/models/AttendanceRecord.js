const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  rfidTag: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD format
    index: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true,
    default: 'Present'
  },
  time: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
attendanceRecordSchema.index({ studentId: 1, date: 1 });
attendanceRecordSchema.index({ rfidTag: 1, date: 1 });
attendanceRecordSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
