const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function fixAdminStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_security_db');
    
    console.log('Checking admin status...');
    
    const admins = await Admin.find({});
    console.log('Current admins:', admins.length);
    
    if (admins.length === 0) {
      console.log('No admin found! Creating default admin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = new Admin({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        permissions: {
          canManageStudents: true,
          canViewReports: true,
          canManageUsers: false,
          canExportData: true
        }
      });
      
      await admin.save();
      console.log('✅ Default admin created: username: admin, password: admin123');
    } else {
      console.log('Admins found:');
      admins.forEach(admin => {
        console.log(`- ${admin.username}: isActive = ${admin.isActive}, role = ${admin.role}`);
      });
      
      // Make all admins active
      const result = await Admin.updateMany({}, { 
        $set: { 
          isActive: true 
        } 
      });
      
      console.log(`✅ Updated ${result.modifiedCount} admin(s) to active status`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminStatus();



