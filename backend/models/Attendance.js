const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  entryType: {
    type: String,
    enum: ['rfid', 'manual', 'simulation'],
    default: 'rfid'
  },
  location: {
    type: String,
    default: 'Main Gate',
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
attendanceSchema.index({ studentId: 1, timestamp: -1 });
attendanceSchema.index({ timestamp: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ date: -1 });

// Compound index for daily attendance queries
attendanceSchema.index({
  studentId: 1,
  date: 1
});

// Compound index for student daily attendance
attendanceSchema.index({
  studentId: 1,
  date: 1,
  status: 1
});

module.exports = mongoose.model('Attendance', attendanceSchema);