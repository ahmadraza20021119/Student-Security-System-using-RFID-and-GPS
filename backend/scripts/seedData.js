const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Attendance = require('../models/Attendance');
const Location = require('../models/Location');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_security_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleStudents = [
  {
    name: 'Aarav Sharma',
    studentId: 'STU001',
    rfidTag: 'RFID001',
    class: '10',
    section: 'A',
    rollNumber: '1',
    dateOfBirth: new Date('2008-03-15'),
    gender: 'Male',
    parentName: 'Rajesh Sharma',
    parentContact: '+91-9876543210',
    parentEmail: 'rajesh.sharma@email.com',
    address: '123 MG Road, Bangalore, Karnataka 560001',
    emergencyContact: '+91-9876543211',
    bloodGroup: 'O+',
    medicalConditions: 'None'
  },
  {
    name: 'Priya Patel',
    studentId: 'STU002',
    rfidTag: 'RFID002',
    class: '10',
    section: 'A',
    rollNumber: '2',
    dateOfBirth: new Date('2008-07-22'),
    gender: 'Female',
    parentName: 'Amit Patel',
    parentContact: '+91-9876543212',
    parentEmail: 'amit.patel@email.com',
    address: '456 Brigade Road, Bangalore, Karnataka 560025',
    emergencyContact: '+91-9876543213',
    bloodGroup: 'A+',
    medicalConditions: 'Mild asthma'
  },
  {
    name: 'Arjun Kumar',
    studentId: 'STU003',
    rfidTag: 'RFID003',
    class: '10',
    section: 'B',
    rollNumber: '3',
    dateOfBirth: new Date('2008-11-08'),
    gender: 'Male',
    parentName: 'Suresh Kumar',
    parentContact: '+91-9876543214',
    parentEmail: 'suresh.kumar@email.com',
    address: '789 Commercial Street, Bangalore, Karnataka 560001',
    emergencyContact: '+91-9876543215',
    bloodGroup: 'B+',
    medicalConditions: 'None'
  },
  {
    name: 'Ananya Singh',
    studentId: 'STU004',
    rfidTag: 'RFID004',
    class: '10',
    section: 'B',
    rollNumber: '4',
    dateOfBirth: new Date('2008-05-12'),
    gender: 'Female',
    parentName: 'Vikram Singh',
    parentContact: '+91-9876543216',
    parentEmail: 'vikram.singh@email.com',
    address: '321 Koramangala, Bangalore, Karnataka 560034',
    emergencyContact: '+91-9876543217',
    bloodGroup: 'AB+',
    medicalConditions: 'Food allergies (nuts)'
  },
  {
    name: 'Rohan Gupta',
    studentId: 'STU005',
    rfidTag: 'RFID005',
    class: '9',
    section: 'A',
    rollNumber: '5',
    dateOfBirth: new Date('2009-01-30'),
    gender: 'Male',
    parentName: 'Manoj Gupta',
    parentContact: '+91-9876543218',
    parentEmail: 'manoj.gupta@email.com',
    address: '654 Whitefield, Bangalore, Karnataka 560066',
    emergencyContact: '+91-9876543219',
    bloodGroup: 'O-',
    medicalConditions: 'None'
  },
  {
    name: 'Kavya Reddy',
    studentId: 'STU006',
    rfidTag: 'RFID006',
    class: '9',
    section: 'A',
    rollNumber: '6',
    dateOfBirth: new Date('2009-09-14'),
    gender: 'Female',
    parentName: 'Ravi Reddy',
    parentContact: '+91-9876543220',
    parentEmail: 'ravi.reddy@email.com',
    address: '987 Electronic City, Bangalore, Karnataka 560100',
    emergencyContact: '+91-9876543221',
    bloodGroup: 'A-',
    medicalConditions: 'Diabetes Type 1'
  },
  {
    name: 'Karan Joshi',
    studentId: 'STU007',
    rfidTag: 'RFID007',
    class: '11',
    section: 'A',
    rollNumber: '7',
    dateOfBirth: new Date('2007-12-03'),
    gender: 'Male',
    parentName: 'Deepak Joshi',
    parentContact: '+91-9876543222',
    parentEmail: 'deepak.joshi@email.com',
    address: '147 Indiranagar, Bangalore, Karnataka 560038',
    emergencyContact: '+91-9876543223',
    bloodGroup: 'B-',
    medicalConditions: 'None'
  },
  {
    name: 'Shreya Agarwal',
    studentId: 'STU008',
    rfidTag: 'RFID008',
    class: '11',
    section: 'B',
    rollNumber: '8',
    dateOfBirth: new Date('2007-04-18'),
    gender: 'Female',
    parentName: 'Rohit Agarwal',
    parentContact: '+91-9876543224',
    parentEmail: 'rohit.agarwal@email.com',
    address: '258 Jayanagar, Bangalore, Karnataka 560011',
    emergencyContact: '+91-9876543225',
    bloodGroup: 'AB-',
    medicalConditions: 'Lactose intolerant'
  }
];

const sampleAdmins = [
  {
    username: 'admin',
    email: 'admin@school.edu',
    fullName: 'System Administrator',
    role: 'admin',
    permissions: {
      canManageStudents: true,
      canViewReports: true,
      canManageUsers: true,
      canExportData: true
    }
  },
  {
    username: 'principal',
    email: 'principal@school.edu',
    fullName: 'School Principal',
    role: 'principal',
    permissions: {
      canManageStudents: true,
      canViewReports: true,
      canManageUsers: false,
      canExportData: true
    }
  },
  {
    username: 'security',
    email: 'security@school.edu',
    fullName: 'Security Staff',
    role: 'security',
    permissions: {
      canManageStudents: false,
      canViewReports: true,
      canManageUsers: false,
      canExportData: false
    }
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Student.deleteMany({});
    await Admin.deleteMany({});
    await Attendance.deleteMany({});
    await Location.deleteMany({});

    // Seed Students
    console.log('👥 Seeding students...');
    const students = await Student.insertMany(sampleStudents);
    console.log(`✅ Created ${students.length} students`);

    // Seed Admins with hashed passwords
    console.log('🔐 Seeding admin users...');
    const adminsWithPasswords = await Promise.all(
      sampleAdmins.map(async (admin) => {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        return { ...admin, password: hashedPassword };
      })
    );
    const admins = await Admin.insertMany(adminsWithPasswords);
    console.log(`✅ Created ${admins.length} admin users`);

    // Seed some sample attendance data for the last few days
    console.log('📅 Seeding attendance data...');
    const today = new Date();
    const attendanceData = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add random attendance for some students
      const randomStudents = students.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * students.length) + 1);
      
      for (const student of randomStudents) {
        const hour = Math.floor(Math.random() * 3) + 7; // Between 7-10 AM
        const minute = Math.floor(Math.random() * 60);
        const attendanceTime = new Date(date);
        attendanceTime.setHours(hour, minute, 0, 0);

        attendanceData.push({
          studentId: student._id,
          studentName: student.name,
          timestamp: attendanceTime,
          status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent'),
          entryType: Math.random() > 0.3 ? 'rfid' : 'simulation'
        });
      }
    }

    await Attendance.insertMany(attendanceData);
    console.log(`✅ Created ${attendanceData.length} attendance records`);

    // Seed some sample location data
    console.log('📍 Seeding location data...');
    const locationData = students.slice(0, 5).map((student, index) => ({
      studentId: student._id,
      coordinates: {
        // Random coordinates around Bangalore area
        latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.1
      },
      timestamp: new Date(),
      accuracy: Math.floor(Math.random() * 50) + 10, // 10-60 meters
      isInSchoolZone: Math.random() > 0.5
    }));

    await Location.insertMany(locationData);
    console.log(`✅ Created ${locationData.length} location records`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${students.length} Students created`);
    console.log(`   • ${admins.length} Admin users created`);
    console.log(`   • ${attendanceData.length} Attendance records created`);
    console.log(`   • ${locationData.length} Location records created`);
    console.log('\n🔑 Default login credentials:');
    console.log('   • Username: admin, Password: admin123 (System Admin)');
    console.log('   • Username: principal, Password: admin123 (Principal)');
    console.log('   • Username: security, Password: admin123 (Security Staff)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
    process.exit(0);
  }
};

// Run the seed function
seedDatabase();