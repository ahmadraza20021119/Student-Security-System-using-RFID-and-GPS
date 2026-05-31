const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  rfidTag: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  studentEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContact: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    enum: ['CSE','ECE','EEE','ME','CE','IT','AIML','DS','CIV','BIO','CHE','Other'],
    default: 'CSE',
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  medicalConditions: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPresent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ name: 'text' });

module.exports = mongoose.model('Student', studentSchema);