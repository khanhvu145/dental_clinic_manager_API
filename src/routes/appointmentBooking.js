const express = require('express');
const appointmentBookingController = require('../controllers/AppointmentBookingController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/getEmptyCalendar', GetAccessToken('appointment', 'view'), appointmentBookingController.getEmptyCalendar);
router.post('/updateStatusToNoArrivedJob', appointmentBookingController.updateStatusToNoArrivedJob);
router.post('/create', GetAccessToken('appointment', 'create'), appointmentBookingController.create);

module.exports = router;
