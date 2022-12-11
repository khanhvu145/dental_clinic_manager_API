const express = require('express');
const appointmentController = require('../controllers/AppointmentController');
const router = express.Router();

router.post('/create', appointmentController.create);

module.exports = router;