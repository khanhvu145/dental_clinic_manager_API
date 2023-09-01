const express = require('express');
const reportController = require('../controllers/ReportController');
const router = express.Router();

router.post('/getOverviewReport', reportController.getOverviewReport);

module.exports = router;