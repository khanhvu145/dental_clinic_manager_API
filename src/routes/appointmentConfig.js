const express = require('express');
const appointmentConfigController = require('../controllers/AppointmentConfigController');
const router = express.Router();

router.post('/createUpdate', appointmentConfigController.createUpdate);
router.get('/getData', appointmentConfigController.getData);

module.exports = router;