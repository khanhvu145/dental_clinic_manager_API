const express = require('express');
const PaymentSlipController = require('../controllers/PaymentSlipController');
const router = express.Router();

router.post('/updateOriginalDocuments', PaymentSlipController.updateOriginalDocuments);
router.post('/complete', PaymentSlipController.complete);
router.get('/getById/:id/', PaymentSlipController.getById);
router.post('/create', PaymentSlipController.create);
router.post('/getByQuery', PaymentSlipController.getByQuery);

module.exports = router;