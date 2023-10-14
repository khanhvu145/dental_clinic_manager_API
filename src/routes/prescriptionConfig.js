const express = require('express');
const PrescriptionConfigController = require('../controllers/PrescriptionConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/getByTextSearch', verifyToken, PrescriptionConfigController.getByTextSearch);
router.post('/create', GetAccessToken('prescriptionConfig', 'create'), PrescriptionConfigController.create);
router.post('/getByQuery', GetAccessToken('prescriptionConfig', 'view'), PrescriptionConfigController.getByQuery);
router.get('/getById/:id/', verifyToken, PrescriptionConfigController.getById);
router.put('/update', GetAccessToken('prescriptionConfig', 'update'), PrescriptionConfigController.update);

module.exports = router;