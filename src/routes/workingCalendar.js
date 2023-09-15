const express = require('express');
const WorkingCalendarController = require('../controllers/WorkingCalendarController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/getById', GetAccessToken('workingCalendar', 'view'), WorkingCalendarController.getById);
router.post('/getWorkingCalendar', GetAccessToken('workingCalendar', 'view'), WorkingCalendarController.getWorkingCalendar);

module.exports = router;
