const express = require('express');
const appointmentConfigController = require('../controllers/AppointmentConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/update', GetAccessToken('appointmentConfig', 'update'), appointmentConfigController.update);
router.post('/getDataByKey', appointmentConfigController.getDataByKey);
router.post('/getDataByListKey', appointmentConfigController.getDataByListKey);
router.post('/createUpdate', appointmentConfigController.createUpdate);
router.get('/getData', appointmentConfigController.getData);

module.exports = router;