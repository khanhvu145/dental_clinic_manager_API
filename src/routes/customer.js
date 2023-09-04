const express = require('express');
const multer = require('../middlewares/Multer');
const customerController = require('../controllers/CustomerController');
const router = express.Router();

router.get('/getPrescriptionByExaminationId/:id/', customerController.getPrescriptionByExaminationId);
router.post('/updatePrescription', customerController.updatePrescription);
router.post('/createPrescription', customerController.createPrescription);
router.post('/cancelExamination', customerController.cancelExamination);
router.post('/confirmExamination', customerController.confirmExamination);
router.post('/removeDesignationFile', customerController.removeDesignationFile);
router.post('/uploadDesignation', multer.any('fileList'), customerController.uploadDesignation);
router.delete('/removeDesignation/:id/', customerController.removeDesignation);
router.post('/getByQueryDiary', customerController.getByQueryDiary);
router.get('/getExaminationById/:id/', customerController.getExaminationById);
router.post('/getByQueryExamination', customerController.getByQueryExamination);
router.post('/getLatestExamination', customerController.getLatestExamination);
router.post('/updateExamination', multer.any('attachFiles'), customerController.updateExamination);
router.post('/createExamination', multer.any('attachFiles'), customerController.createExamination);
router.post('/create', multer.single('imageFile'), customerController.create);
router.put('/update', multer.single('imageFile'), customerController.update);
router.get('/getAll', customerController.getAll);
router.get('/getById/:id/', customerController.getById);
router.post('/getByTextSearch', customerController.getByTextSearch);
router.post('/getByQuery', customerController.getByQuery);

module.exports = router;