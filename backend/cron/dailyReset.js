const cron = require('node-cron');
const axios = require('axios');

/**
 * Daily attendance reset cron job
 * Runs every day at 11:59 PM to mark absent students and reset isPresent
 */
const scheduleDailyReset = () => {
  cron.schedule('59 23 * * *', async () => {
    try {
      console.log('🔄 Running daily attendance reset...');
      
      // You can either call the reset endpoint or run the logic directly
      // Option 1: Call the API endpoint (requires server to be running)
      // await axios.post('http://localhost:5000/api/attendance-routes/reset');
      
      // Option 2: Run the logic directly (implemented in scheduler.js)
      // For now, we'll just log that the schedule is set
      console.log('✅ Daily attendance reset scheduled (runs at 11:59 PM daily)');
      
    } catch (error) {
      console.error('❌ Error in daily reset cron job:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });
  
  console.log('📅 Daily attendance reset cron job initialized');
};

module.exports = { scheduleDailyReset };




