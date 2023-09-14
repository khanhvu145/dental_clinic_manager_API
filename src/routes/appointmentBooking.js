const express = require('express');
const appointmentBookingController = require('../controllers/AppointmentBookingController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/getWorkingCalendar', GetAccessToken('workingCalendar', 'view'), appointmentBookingController.getWorkingCalendar);
router.post('/cancelBooking', GetAccessToken('appointment', 'cancelBooking'), appointmentBookingController.cancelBooking);
router.post('/completeBooking', GetAccessToken('appointment', 'completeBooking'), appointmentBookingController.completeBooking);
router.post('/confirmBooking', GetAccessToken('appointment', 'confirmBooking'), appointmentBookingController.confirmBooking);
router.post('/sendMail', GetAccessToken('appointment', 'sendMail'), appointmentBookingController.sendMail);
router.get('/getLogs/:id/', GetAccessToken('appointment', 'view'), appointmentBookingController.getLogs);
router.post('/update', GetAccessToken('appointment', 'update'), appointmentBookingController.update);
router.post('/getById', GetAccessToken('appointment', 'view'), appointmentBookingController.getById);
router.post('/getByQuery', GetAccessToken('appointment', 'view'), appointmentBookingController.getByQuery);
router.post('/getEmptyCalendar', GetAccessToken('appointment', 'view'), appointmentBookingController.getEmptyCalendar);
router.post('/updateStatusToNoArrivedJob', appointmentBookingController.updateStatusToNoArrivedJob);
router.post('/create', GetAccessToken('appointment', 'create'), appointmentBookingController.create);

module.exports = router;
