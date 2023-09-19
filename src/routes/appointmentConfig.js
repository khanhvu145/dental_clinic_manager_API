const express = require('express');
const appointmentConfigController = require('../controllers/AppointmentConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/update', GetAccessToken('appointmentConfig', 'update'), appointmentConfigController.update);
router.post('/getDataByKey', verifyToken, appointmentConfigController.getDataByKey);
router.post('/getDataByListKey', verifyToken, appointmentConfigController.getDataByListKey);

module.exports = router;