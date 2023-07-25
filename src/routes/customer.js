const express = require('express');
const multer = require('../middlewares/Multer');
const customerController = require('../controllers/CustomerController');
const router = express.Router();

router.delete('/cancelExamination/:id/', customerController.cancelExamination);
router.post('/getByQueryDiary', customerController.getByQueryDiary);
router.get('/getExaminationById/:id/', customerController.getExaminationById);
router.post('/getByQueryExamination', customerController.getByQueryExamination);
router.post('/getLatestExamination', customerController.getLatestExamination);
router.post('/createExamination', multer.any('attachFiles'), customerController.createExamination);
router.post('/create', multer.single('imageFile'), customerController.create);
router.put('/update', multer.single('imageFile'), customerController.update);
router.get('/getAll', customerController.getAll);
router.get('/getById/:id/', customerController.getById);
router.post('/getByQuery', customerController.getByQuery);

module.exports = router;