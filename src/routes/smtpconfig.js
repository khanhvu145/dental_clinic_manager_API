const express = require('express');
const SMTPConfigController = require('../controllers/SMTPConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

/**
 * @openapi
 * '/api/smtpConfig/createUpdate':
 *  post:
 *     tags:
 *      - SMTPConfig
 *     summary: Create/update SMTP
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - name
 *              - email
 *              - password
 *              - host
 *            properties:
 *              name:
 *                type: string
 *                example: Nha khoa An Tâm
 *              password:
 *                type: string
 *                example: Aa123456
 *              email:
 *                type: string
 *                example: dentalclinic@gmail.com
 *              host:
 *                type: string
 *                example: smtp.gmail.com
 *              isActive:
 *                type: bool
 *                example: true
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
router.post('/createUpdate', GetAccessToken('smtpConfig', 'update'), SMTPConfigController.createUpdate);
/**
 * @openapi
 * '/api/smtpConfig/getData':
 *  get:
 *     tags:
 *      - SMTPConfig
 *     summary: Get smtp data
 *     security:
 *      - bearerAuth: []
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
router.get('/getData', GetAccessToken('smtpConfig', 'view'), SMTPConfigController.getData);

module.exports = router;