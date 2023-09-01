const express = require('express');
const receiptsController = require('../controllers/ReceiptsController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/cancel', GetAccessToken('receipts', 'cancelReceipts'), receiptsController.cancel);
router.get('/getReceiptsByPaymentId/:id/', receiptsController.getReceiptsByPaymentId);
router.get('/getById/:id/', receiptsController.getById);
router.post('/getByQuery', GetAccessToken('receipts', 'view'), receiptsController.getByQuery);

module.exports = router;