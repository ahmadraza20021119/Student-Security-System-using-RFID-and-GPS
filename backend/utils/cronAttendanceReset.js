const cron = require('node-cron');
const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');

/**
 * Helper function to format date as "YYYY-MM-DD"
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper function to add days to a date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Daily attendance reset and absent marking
 * Runs every day at 11:59 PM
 */
const scheduleDailyAttendanceReset = () => {
  cron.schedule('59 23 * * *', async () => {
    try {
      console.log('🔄 Starting daily attendance reset...');
      
      const today = formatDate(new Date());
      const yesterday = formatDate(addDays(new Date(), -1));
      
      console.log(`📅 Processing attendance for: ${yesterday}`);
      
      const students = await Student.find({ isActive: true });
      let absentCount = 0;

      // Mark absent students who didn't scan yesterday
      for (const student of students) {
        // Check if student has a "Present" record for yesterday
        const yesterdayRecord = await AttendanceRecord.findOne({
          rfidTag: student.rfidTag,
          date: yesterday,
          status: 'Present'
        });

        // If no present record, create absent record for yesterday
        if (!yesterdayRecord) {
          const absentRecord = await AttendanceRecord.findOne({
            rfidTag: student.rfidTag,
            date: yesterday,
            status: 'Absent'
          });

          if (!absentRecord) {
            await AttendanceRecord.create({
              studentId: student._id,
              studentName: student.name,
              rfidTag: student.rfidTag,
              date: yesterday,
              status: 'Absent',
              time: 'Not Scanned'
            });
            absentCount++;
            console.log(`📝 Marked ${student.name} as absent for ${yesterday}`);
          }
        }

        // Reset isPresent for next day
        student.isPresent = false;
        await student.save();
      }

      console.log(`✅ Daily attendance reset completed: ${students.length} students reset, ${absentCount} absent records created`);
      
    } catch (error) {
      console.error('❌ Error during daily attendance reset:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('📅 Daily attendance reset cron job started (runs at 11:59 PM)');
};

module.exports = { scheduleDailyAttendanceReset };


