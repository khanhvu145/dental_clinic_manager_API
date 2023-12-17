const express = require('express');
const receiptsController = require('../controllers/ReceiptsController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/export', GetAccessToken('receipts', 'export'), receiptsController.export);
router.post('/cancel', GetAccessToken('receipts', 'cancelReceipts'), receiptsController.cancel);
router.post('/getReceiptsByPaymentId', verifyToken, receiptsController.getReceiptsByPaymentId);
/**
 * @openapi
 * '/api/receipts/getById/{id}':
 *  get:
 *     tags:
 *      - Receipts
 *     summary: Get receipts by query
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
router.get('/getById/:id/', verifyToken, receiptsController.getById);
/**
 * @openapi
 * '/api/receipts/getByQuery':
 *  post:
 *     tags:
 *      - Receipts
 *     summary: Get receipts by query
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
 *                  statusF: 'all'
 *                  codeF: ''
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
router.post('/getByQuery', GetAccessToken('receipts', 'view'), receiptsController.getByQuery);

module.exports = router;