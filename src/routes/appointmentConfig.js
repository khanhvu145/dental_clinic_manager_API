const express = require('express');
const appointmentConfigController = require('../controllers/AppointmentConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

/**
 * @openapi
 * '/api/appointmentConfig/update':
 *  post:
 *     tags:
 *      - AppointmentConfig
 *     summary: Update appointment config
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: array
 *            example: [
 *                  {
 *                      key: 'WORKING_TIME_MORNING_START',
 *                      value: '07:00'
 *                  }
 *            ]
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
router.post('/update', GetAccessToken('appointmentConfig', 'update'), appointmentConfigController.update);
/**
 * @openapi
 * '/api/appointmentConfig/getDataByKey':
 *  post:
 *     tags:
 *      - AppointmentConfig
 *     summary: Get config by key
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - key
 *            properties:
 *              key:
 *                type: string
 *                example: WORKING_TIME_MORNING_START
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
router.post('/getDataByKey', verifyToken, appointmentConfigController.getDataByKey);
/**
 * @openapi
 * '/api/appointmentConfig/getDataByListKey':
 *  post:
 *     tags:
 *      - AppointmentConfig
 *     summary: Get config by keys
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: array
 *            example: [
 *              'WORKING_TIME_MORNING_START',
 *              'WORKING_TIME_MORNING_END'
 *            ]
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
router.post('/getDataByListKey', verifyToken, appointmentConfigController.getDataByListKey);

module.exports = router;