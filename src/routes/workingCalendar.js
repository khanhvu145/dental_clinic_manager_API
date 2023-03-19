const express = require('express');
const WorkingCalendarController = require('../controllers/WorkingCalendarController');
const router = express.Router();

router.post('/getWorkingCalendarByDentist', WorkingCalendarController.getWorkingCalendarByDentist);

module.exports = router;
