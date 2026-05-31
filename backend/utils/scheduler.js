const cron = require('node-cron');
const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');

// Helper function to format time as "HH:MM AM/PM"
const formatTime = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

/**
 * Daily attendance reset scheduler
 * Runs every day at midnight (00:00) to reset all students' isPresent status
 * and mark absent students in attendance records
 */
const scheduleDailyReset = () => {
  // Schedule to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🔄 Starting daily attendance reset...');
      
      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get all active students
      const allStudents = await Student.find({ isActive: true });
      
      // For each student, check if they have an attendance record for yesterday
      for (const student of allStudents) {
        const attendanceRecord = await AttendanceRecord.findOne({
          studentId: student._id,
          date: yesterdayStr,
          status: 'Present'
        });
        
        // If no attendance record exists, create an absent record
        if (!attendanceRecord) {
          await AttendanceRecord.create({
            studentId: student._id,
            studentName: student.name,
            rfidTag: student.rfidTag,
            date: yesterdayStr,
            status: 'Absent',
            time: 'Not Scanned'
          });
          console.log(`📝 Marked ${student.name} as absent for ${yesterdayStr}`);
        }
      }
      
      // Reset all active students' isPresent field to false for new day
      const resetResult = await Student.updateMany(
        { isActive: true },
        { isPresent: false }
      );
      
      console.log(`✅ Daily reset completed: ${resetResult.modifiedCount} students reset to absent`);
      console.log(`📅 Daily attendance reset at ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('❌ Error during daily attendance reset:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('📅 Daily attendance reset scheduler started (runs at midnight)');
};

/**
 * Manual daily reset function (for testing or manual triggers)
 */
const manualDailyReset = async () => {
  try {
    console.log('🔄 Manual daily attendance reset started...');
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get all active students
    const allStudents = await Student.find({ isActive: true });
    let absentCount = 0;
    
    // For each student, check if they have an attendance record for yesterday
    for (const student of allStudents) {
      const attendanceRecord = await AttendanceRecord.findOne({
        studentId: student._id,
        date: yesterdayStr,
        status: 'Present'
      });
      
      // If no attendance record exists, create an absent record
      if (!attendanceRecord) {
        await AttendanceRecord.create({
          studentId: student._id,
          studentName: student.name,
          rfidTag: student.rfidTag,
          date: yesterdayStr,
          status: 'Absent',
          time: 'Not Scanned'
        });
        absentCount++;
      }
    }
    
    // Reset all active students' isPresent field to false
    const result = await Student.updateMany(
      { isActive: true },
      { isPresent: false }
    );
    
    console.log(`✅ Manual reset completed: ${result.modifiedCount} students reset, ${absentCount} absent records created`);
    return {
      success: true,
      message: `Reset ${result.modifiedCount} students to absent, created ${absentCount} absent records`,
      modifiedCount: result.modifiedCount,
      absentRecordsCreated: absentCount
    };
    
  } catch (error) {
    console.error('❌ Error during manual reset:', error);
    return {
      success: false,
      message: 'Reset failed',
      error: error.message
    };
  }
};

module.exports = {
  scheduleDailyReset,
  manualDailyReset
};
