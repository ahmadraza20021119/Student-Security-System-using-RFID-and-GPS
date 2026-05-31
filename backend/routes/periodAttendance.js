const express = require('express');
const router = express.router();
const { getPeriodAttendance, updatePeriodAttendance, bulkUpdatePeriodAttendance } = require('../controllers/periodAttendanceController');

router.get('/', getPeriodAttendance);
router.post('/period', updatePeriodAttendance);
router.post('/bulk', bulkUpdatePeriodAttendance);

module.exports = router;
