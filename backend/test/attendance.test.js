const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

let authToken;
let testStudent;

// Test database connection
beforeAll(async () => {
  const mongoURI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/student_security_test';
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create test admin and get token
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  await Admin.create({
    username: 'testadmin',
    password: hashedPassword,
    email: 'test@example.com',
    role: 'admin',
    isActive: true,
    permissions: {
      canManageStudents: true,
      canViewReports: true,
      canManageUsers: true,
      canExportData: true
    }
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'testadmin',
      password: 'testpass123'
    });

  authToken = loginResponse.body.token;

  // Create test student
  testStudent = await Student.create({
    name: 'Test Student',
    studentId: 'STU001',
    rfidTag: 'RFID001',
    class: '10',
    section: 'A',
    rollNumber: '1',
    dateOfBirth: '2008-01-15',
    gender: 'Male',
    parentName: 'Test Parent',
    parentContact: '+919876543210',
    parentEmail: 'parent@example.com',
    address: '123 Test Street',
    emergencyContact: '+919876543211',
    bloodGroup: 'O+',
    isActive: true
  });
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clear attendance before each test
beforeEach(async () => {
  await Attendance.deleteMany({});
});

describe('Attendance Management Tests', () => {
  describe('POST /api/attendance', () => {
    test('Should create manual attendance entry', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: testStudent._id,
          status: 'present',
          location: 'Main Gate',
          notes: 'Manual entry'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.studentId._id.toString()).toBe(testStudent._id.toString());
      expect(response.body.data.status).toBe('present');
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          studentId: testStudent._id,
          status: 'present'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: fakeId,
          status: 'present'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with duplicate attendance for same day', async () => {
      // Create first attendance
      await Attendance.create({
        studentId: testStudent._id,
        studentName: testStudent.name,
        timestamp: new Date(),
        status: 'present',
        entryType: 'manual'
      });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: testStudent._id,
          status: 'present'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already recorded/i);
    });
  });

  describe('GET /api/attendance', () => {
    beforeEach(async () => {
      // Create test attendance records
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await Attendance.create([
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: today,
          status: 'present',
          entryType: 'rfid'
        },
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: yesterday,
          status: 'present',
          entryType: 'manual'
        }
      ]);
    });

    test('Should get all attendance records', async () => {
      const response = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Should filter by date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/attendance?date=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Should filter by student ID', async () => {
      const response = await request(app)
        .get(`/api/attendance?studentId=${testStudent._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(a => a.studentId._id.toString() === testStudent._id.toString())).toBe(true);
    });

    test('Should filter by status', async () => {
      const response = await request(app)
        .get('/api/attendance?status=present')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(a => a.status === 'present')).toBe(true);
    });

    test('Should filter by entry type', async () => {
      const response = await request(app)
        .get('/api/attendance?entryType=rfid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(a => a.entryType === 'rfid')).toBe(true);
    });

    test('Should paginate results', async () => {
      const response = await request(app)
        .get('/api/attendance?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/attendance');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/attendance/:id', () => {
    let attendanceId;

    beforeEach(async () => {
      const attendance = await Attendance.create({
        studentId: testStudent._id,
        studentName: testStudent.name,
        timestamp: new Date(),
        status: 'present',
        entryType: 'manual'
      });
      attendanceId = attendance._id;
    });

    test('Should get attendance by ID', async () => {
      const response = await request(app)
        .get(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(attendanceId.toString());
    });

    test('Should fail with non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/attendance/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/attendance/:id', () => {
    let attendanceId;

    beforeEach(async () => {
      const attendance = await Attendance.create({
        studentId: testStudent._id,
        studentName: testStudent.name,
        timestamp: new Date(),
        status: 'present',
        entryType: 'manual'
      });
      attendanceId = attendance._id;
    });

    test('Should update attendance record', async () => {
      const response = await request(app)
        .put(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'late',
          notes: 'Updated status'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('late');
      expect(response.body.data.notes).toBe('Updated status');
    });

    test('Should fail with non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/attendance/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'late'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/attendance/:id', () => {
    let attendanceId;

    beforeEach(async () => {
      const attendance = await Attendance.create({
        studentId: testStudent._id,
        studentName: testStudent.name,
        timestamp: new Date(),
        status: 'present',
        entryType: 'manual'
      });
      attendanceId = attendance._id;
    });

    test('Should delete attendance record', async () => {
      const response = await request(app)
        .delete(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await Attendance.findById(attendanceId);
      expect(deleted).toBeNull();
    });

    test('Should fail with non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/attendance/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/attendance/summary/daily', () => {
    beforeEach(async () => {
      // Create multiple attendance records for today
      const today = new Date();
      
      // Create more test students
      const student2 = await Student.create({
        name: 'Student 2',
        studentId: 'STU002',
        rfidTag: 'RFID002',
        class: '10',
        section: 'A',
        rollNumber: '2',
        dateOfBirth: '2008-02-15',
        gender: 'Female',
        parentName: 'Parent 2',
        parentContact: '+919876543212',
        parentEmail: 'parent2@example.com',
        address: '124 Test Street',
        emergencyContact: '+919876543213',
        bloodGroup: 'A+',
        isActive: true
      });

      await Attendance.create([
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: today,
          status: 'present',
          entryType: 'rfid'
        },
        {
          studentId: student2._id,
          studentName: student2.name,
          timestamp: today,
          status: 'late',
          entryType: 'manual'
        }
      ]);
    });

    test('Should get daily attendance summary', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/attendance/summary/daily?date=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalStudents).toBeGreaterThan(0);
      expect(response.body.data.presentCount).toBeGreaterThan(0);
      expect(response.body.data.attendancePercentage).toBeDefined();
    });
  });

  describe('GET /api/attendance/stats/overview', () => {
    beforeEach(async () => {
      // Create attendance records for statistics
      await Attendance.create([
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: new Date(),
          status: 'present',
          entryType: 'rfid'
        },
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: new Date(Date.now() - 86400000), // Yesterday
          status: 'late',
          entryType: 'manual'
        }
      ]);
    });

    test('Should get attendance statistics', async () => {
      const response = await request(app)
        .get('/api/attendance/stats/overview?days=30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRecords).toBeGreaterThan(0);
      expect(response.body.data.statusBreakdown).toBeDefined();
      expect(response.body.data.entryTypeBreakdown).toBeDefined();
    });
  });

  describe('GET /api/attendance/student/:studentId/history', () => {
    beforeEach(async () => {
      // Create attendance history
      await Attendance.create([
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: new Date(),
          status: 'present',
          entryType: 'rfid'
        },
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: new Date(Date.now() - 86400000),
          status: 'present',
          entryType: 'manual'
        },
        {
          studentId: testStudent._id,
          studentName: testStudent.name,
          timestamp: new Date(Date.now() - 172800000),
          status: 'late',
          entryType: 'rfid'
        }
      ]);
    });

    test('Should get student attendance history', async () => {
      const response = await request(app)
        .get(`/api/attendance/student/${testStudent._id}/history?days=7`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.student).toBeDefined();
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.history.length).toBeGreaterThan(0);
    });

    test('Should fail with non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/attendance/student/${fakeId}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});