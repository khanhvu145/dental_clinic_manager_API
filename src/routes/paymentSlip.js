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
/**
 * @openapi
 * '/api/paymentSlip/getById/{id}':
 *  get:
 *     tags:
 *      - PaymentSlip
 *     summary: Get payment slip by query
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
router.get('/getById/:id/', verifyToken, PaymentSlipController.getById);
router.post('/create', GetAccessToken('payment', 'create'), PaymentSlipController.create);
/**
 * @openapi
 * '/api/paymentSlip/getByQuery':
 *  post:
 *     tags:
 *      - PaymentSlip
 *     summary: Get payment slip by query
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
 *                  dateF: []
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
router.post('/getByQuery', GetAccessToken('payment', 'view'), PaymentSlipController.getByQuery);

module.exports = router;