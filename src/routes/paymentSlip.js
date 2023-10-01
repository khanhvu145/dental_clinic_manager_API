const express = require('express');
const PaymentSlipController = require('../controllers/PaymentSlipController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const multer = require('../middlewares/Multer');
const router = express.Router();

router.post('/import', GetAccessToken('payment', 'import'), multer.single('importFile'), PaymentSlipController.import);
router.post('/getTemplateImport', GetAccessToken('payment', 'import'), PaymentSlipController.getTemplateImport);
router.post('/export', GetAccessToken('payment', 'export'), PaymentSlipController.export);
router.post('/cancel', GetAccessToken('payment', 'cancel'), PaymentSlipController.cancel);
router.post('/updateOriginalDocuments', GetAccessToken('payment', 'update'), PaymentSlipController.updateOriginalDocuments);
router.post('/complete', GetAccessToken('payment', 'update'), PaymentSlipController.complete);
router.get('/getById/:id/', verifyToken, PaymentSlipController.getById);
router.post('/create', GetAccessToken('payment', 'create'), PaymentSlipController.create);
router.post('/getByQuery', GetAccessToken('payment', 'view'), PaymentSlipController.getByQuery);

module.exports = router;