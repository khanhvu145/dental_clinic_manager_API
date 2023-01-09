const express = require('express');
const appointmentController = require('../controllers/AppointmentController');
const router = express.Router();

router.post('/booking', appointmentController.booking);
router.get('/getEmptyCalendar', appointmentController.getEmptyCalendar);
router.post('/getByQuery', appointmentController.getByQuery);
router.put('/updateBooking', appointmentController.updateBooking);
router.put('/cancelBooking', appointmentController.cancelBooking);
router.get('/getLogs/:id/', appointmentController.getLogs);
router.put('/changeStatus', appointmentController.changeStatus);

module.exports = router;