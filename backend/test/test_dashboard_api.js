const fetch = require('node-fetch');

async function testDashboardStats() {
  try {
    // Login to get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.token) {
      console.log('✅ Successfully obtained auth token.');
      const token = loginData.token;
      
      // Test dashboard stats endpoint
      const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const statsData = await statsResponse.json();
      console.log('Dashboard Stats API Response:', statsData);

      if (statsData.totalStudents === 0 && statsData.presentToday === 0 && statsData.absentToday === 0) {
        console.log('✅ Dashboard stats endpoint returns expected zeros.');
      } else {
        console.log('❌ Dashboard stats endpoint returned unexpected values.');
      }
    } else {
      console.error('❌ Failed to get auth token. Login failed.', loginData);
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard stats API:', error);
  }
}

testDashboardStats();
