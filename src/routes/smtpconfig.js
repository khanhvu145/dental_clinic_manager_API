const express = require('express');
const SMTPConfigController = require('../controllers/SMTPConfigController');
const router = express.Router();

router.post('/createUpdate', SMTPConfigController.createUpdate);
router.get('/getData', SMTPConfigController.getData);

module.exports = router;