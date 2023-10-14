const express = require('express');
const multer = require('../middlewares/Multer');
const paymentController = require('../controllers/PaymentController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.get('/getById/:id/', verifyToken, paymentController.getById);
router.post('/getByQuery', GetAccessToken('customer', 'viewPayment'), paymentController.getByQuery);
router.post('/confirmPayment', GetAccessToken('customer', 'confirmPayment'), multer.any('files'), paymentController.confirmPayment);

module.exports = router;