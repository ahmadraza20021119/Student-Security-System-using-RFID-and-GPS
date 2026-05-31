const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const http = require('http');
const WebSocket = require('ws');
const { scheduleDailyReset } = require('./utils/scheduler');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Import RFID WebSocket
const { router: rfidWSRouter, initializeRFIDWebSocket } = require('./routes/rfidWebSocket');

// Import route files
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const attendanceRecordRoutes = require('./routes/attendanceRecords');
const attendanceRoutesV2 = require('./routes/attendanceRoutes');
const locationRoutes = require('./routes/locations');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

// Import cron for daily reset
const { scheduleDailyAttendanceReset } = require('./utils/cronAttendanceReset');

// Add RFID routes
app.use('/api/rfid', rfidWSRouter);

// Initialize WebSocket
initializeRFIDWebSocket(wss);



// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_security_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Models
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Location = require('./models/Location');
const Admin = require('./models/Admin');

// Use route files
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendance-records', attendanceRecordRoutes);
app.use('/api/attendance-routes', attendanceRoutesV2); // New attendance system
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// RFID SCAN ENDPOINT (for hardware integration)
app.post('/api/rfid/scan', async (req, res) => {
  try {
    const { rfidTag, timestamp } = req.body;
    
    // Find student by RFID tag
    const student = await Student.findOne({ rfidTag });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create attendance record
    const attendance = new Attendance({
      studentId: student._id,
      studentName: student.name,
      timestamp: timestamp || new Date(),
      status: 'present'
    });

    await attendance.save();
    
    res.json({
      message: 'RFID scan recorded',
      student: student.name,
      timestamp: attendance.timestamp
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GPS LOCATION ENDPOINT (for hardware integration)
app.post('/api/gps/update', async (req, res) => {
  try {
    let { studentId, rfidTag, latitude, longitude, timestamp } = req.body;
    
    let student;
    // 1. Try to find by RFID Tag if provided (Easiest for hardware)
    if (rfidTag) {
      student = await Student.findOne({ rfidTag });
    } 
    // 2. Otherwise try to find by MongoDB ID
    else if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found with provided ID or RFID Tag' });
    }

    // Update or create location record (only store latest)
    await Location.findOneAndUpdate(
      { studentId: student._id },
      {
        studentId: student._id,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        timestamp: timestamp || new Date()
      },
      { upsert: true, new: true }
    );
    
    res.json({ 
      success: true, 
      message: `GPS location updated for ${student.name}` 
    });
  } catch (error) {
    console.error('GPS Update Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SIMULATION ROUTES (for testing without hardware)
app.post('/api/simulate/rfid', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const attendance = new Attendance({
      studentId: student._id,
      studentName: student.name,
      timestamp: new Date(),
      status: 'present',
      entryType: 'simulation'
    });

    await attendance.save();
    
    res.json({
      message: 'Simulated RFID scan recorded',
      student: student.name,
      timestamp: attendance.timestamp
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/simulate/gps', async (req, res) => {
  try {
    const { studentId, latitude, longitude } = req.body;
    
    await Location.findOneAndUpdate(
      { studentId },
      {
        studentId,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        timestamp: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Simulated GPS location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Initialize default admin user
const initializeAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new Admin({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin user created: admin/admin123');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`✅ Server + WebSocket running on port ${PORT}`);
  await initializeAdmin();
  
  // Start the daily attendance reset scheduler
  scheduleDailyReset();
  
  // Start the new daily attendance reset cron job
  scheduleDailyAttendanceReset();
});
module.exports = app;