const express = require('express');
const reportController = require('../controllers/ReportController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/getRevenueExpenditure', GetAccessToken('overview', 'view'), reportController.getRevenueExpenditure);
router.post('/getOverviewReport', GetAccessToken('overview', 'view'), reportController.getOverviewReport);

module.exports = router;