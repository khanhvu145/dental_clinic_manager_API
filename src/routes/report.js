const express = require('express');
const reportController = require('../controllers/ReportController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/getSourceReport', GetAccessToken('customerProfile', 'view'), reportController.getSourceReport);
router.post('/getGroupReport', GetAccessToken('customerProfile', 'view'), reportController.getGroupReport);
router.post('/getCityReport', GetAccessToken('customerProfile', 'view'), reportController.getCityReport);
router.post('/getGenderReport', GetAccessToken('customerProfile', 'view'), reportController.getGenderReport);
router.post('/getAgeGroupReport', GetAccessToken('customerProfile', 'view'), reportController.getAgeGroupReport);
router.post('/getServiceReport', GetAccessToken('overview', 'view'), reportController.getServiceReport);
router.post('/getDentistReport', GetAccessToken('overview', 'view'), reportController.getDentistReport);
router.post('/getServiceGroupReport', GetAccessToken('overview', 'view'), reportController.getServiceGroupReport);
router.post('/getExaminationReport', GetAccessToken('overview', 'view'), reportController.getExaminationReport);
router.post('/getAppointmentReport', GetAccessToken('overview', 'view'), reportController.getAppointmentReport);
router.post('/getDebtReport', GetAccessToken('overview', 'view'), reportController.getDebtReport);
router.post('/getRevenueExpenditureReport', GetAccessToken('overview', 'view'), reportController.getRevenueExpenditureReport);
router.post('/getOverviewReport', GetAccessToken('overview', 'view'), reportController.getOverviewReport);

module.exports = router;