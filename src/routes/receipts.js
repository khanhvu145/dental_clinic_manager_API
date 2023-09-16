const express = require('express');
const receiptsController = require('../controllers/ReceiptsController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/cancel', GetAccessToken('receipts', 'cancelReceipts'), receiptsController.cancel);
router.get('/getReceiptsByPaymentId/:id/', verifyToken, receiptsController.getReceiptsByPaymentId);
router.get('/getById/:id/', verifyToken, receiptsController.getById);
router.post('/getByQuery', GetAccessToken('receipts', 'view'), receiptsController.getByQuery);

module.exports = router;