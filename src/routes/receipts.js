const express = require('express');
const receiptsController = require('../controllers/ReceiptsController');
const router = express.Router();

router.post('/cancel', receiptsController.cancel);
router.get('/getReceiptsByPaymentId/:id/', receiptsController.getReceiptsByPaymentId);
router.get('/getById/:id/', receiptsController.getById);
router.post('/getByQuery', receiptsController.getByQuery);

module.exports = router;