const express = require('express');
const SMTPConfigController = require('../controllers/SMTPConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/createUpdate', GetAccessToken('smtpConfig', 'update'), SMTPConfigController.createUpdate);
router.get('/getData', GetAccessToken('smtpConfig', 'view'), SMTPConfigController.getData);

module.exports = router;