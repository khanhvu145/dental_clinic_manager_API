const express = require('express');
const multer = require('../middlewares/Multer');
const customerController = require('../controllers/CustomerController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.get('/getPrescriptionByExaminationId/:id/', customerController.getPrescriptionByExaminationId);
router.post('/updatePrescription', customerController.updatePrescription);
router.post('/createPrescription', customerController.createPrescription);
router.post('/cancelExamination', customerController.cancelExamination);
router.post('/confirmExamination', customerController.confirmExamination);
router.post('/getByQueryDiary', customerController.getByQueryDiary);
router.post('/getLatestExamination', customerController.getLatestExamination);

router.delete('/removeDesignation/:id/', GetAccessToken('customer', 'updateExamination'), customerController.removeDesignation);
router.post('/removeDesignationFile', GetAccessToken('customer', 'updateExamination'), customerController.removeDesignationFile);
router.post('/uploadDesignation', GetAccessToken('customer', 'updateExamination'), multer.any('fileList'), customerController.uploadDesignation);
router.post('/updateExamination', GetAccessToken('customer', 'updateExamination'), multer.any('attachFiles'), customerController.updateExamination);
router.get('/getExaminationById/:id/', verifyToken, customerController.getExaminationById);
router.post('/createExamination', GetAccessToken('customer', 'createExamination'), multer.any('attachFiles'), customerController.createExamination);
router.post('/getByQueryExamination', GetAccessToken('customer', 'viewExamination'), customerController.getByQueryExamination);
router.post('/create', GetAccessToken('customer', 'create'), multer.single('imageFile'), customerController.create);
router.put('/update', GetAccessToken('customer', 'update'), multer.single('imageFile'), customerController.update);
router.get('/getById/:id/', verifyToken, customerController.getById);
router.post('/getByTextSearch', verifyToken, customerController.getByTextSearch);
router.post('/getByQuery', GetAccessToken('customer', 'view'), customerController.getByQuery);

module.exports = router;