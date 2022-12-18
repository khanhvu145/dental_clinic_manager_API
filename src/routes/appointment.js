const express = require('express');
const appointmentController = require('../controllers/AppointmentController');
const router = express.Router();

router.post('/booking', appointmentController.booking);
router.get('/getEmptyCalendar', appointmentController.getEmptyCalendar);

module.exports = router;