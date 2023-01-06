const express = require('express');
const appointmentController = require('../controllers/AppointmentController');
const router = express.Router();

router.post('/booking', appointmentController.booking);
router.get('/getEmptyCalendar', appointmentController.getEmptyCalendar);
router.post('/getByQuery', appointmentController.getByQuery);
router.put('/updateBooking', appointmentController.updateBooking);
router.put('/changeStatus', appointmentController.changeStatus);
router.put('/cancelBooking', appointmentController.cancelBooking);

module.exports = router;