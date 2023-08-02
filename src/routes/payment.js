const express = require('express');
const multer = require('../middlewares/Multer');
const paymentController = require('../controllers/PaymentController');
const router = express.Router();

router.post('/getByQuery', paymentController.getByQuery);
router.post('/confirmPayment', multer.any('files'), paymentController.confirmPayment);

module.exports = router;