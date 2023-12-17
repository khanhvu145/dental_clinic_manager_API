const express = require('express');
const multer = require('../middlewares/Multer');
const paymentController = require('../controllers/PaymentController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

/**
 * @openapi
 * '/api/payment/getById/{id}':
 *  get:
 *     tags:
 *      - Payment
 *     summary: Get payment by query
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        type: objectId
 *        required: true
 *        example: 630a038c4b0253de39d18206
 *     responses:
 *      200:
 *        description: Successfully
 *      400:
 *        description: Error
 *      403:
 *        description: Invalid token / Not have access
 *      500:
 *        description: Server error
 */
router.get('/getById/:id/', verifyToken, paymentController.getById);
/**
 * @openapi
 * '/api/payment/getByQuery':
 *  post:
 *     tags:
 *      - Payment
 *     summary: Get payment by query
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              filters:
 *                type: object
 *                example:
 *                  customerF: ''
 *                  dateF: []
 *                  examinationCodeF: ''
 *                  statusF: []
 *              sorts:
 *                type: string
 *                example: -1
 *              pages:
 *                type: object
 *                example: 
 *                  from: 0
 *                  size: 10
 *     responses:
 *      200:
 *        description: Successfully
 *      400:
 *        description: Error
 *      403:
 *        description: Invalid token / Not have access
 *      500:
 *        description: Server error
 */
router.post('/getByQuery', GetAccessToken('customer', 'viewPayment'), paymentController.getByQuery);
/**
 * @openapi
 * '/api/payment/confirmPayment':
 *  post:
 *     tags:
 *      - Payment
 *     summary: Confirm payment
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - paidAmount
 *              - methodFee
 *              - paymentId
 *            properties:
 *              paymentId:
 *                type: objectId
 *                example: 630a038c4b0253de39d18206
 *              paidAmount:
 *                type: double
 *                example: 2000000
 *              methodFee:
 *                type: string
 *                example: 'cash'
 *              note:
 *                type: string
 *                example: ''
 *              files:
 *                type: file
 *                example: 
 *     responses:
 *      200:
 *        description: Successfully
 *      400:
 *        description: Error
 *      403:
 *        description: Invalid token / Not have access
 *      500:
 *        description: Server error
 */
router.post('/confirmPayment', GetAccessToken('customer', 'confirmPayment'), multer.any('files'), paymentController.confirmPayment);

module.exports = router;