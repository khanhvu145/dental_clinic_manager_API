const express = require('express');
const WorkingCalendarController = require('../controllers/WorkingCalendarController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

/**
 * @openapi
 * '/api/workingCalendar/getById':
 *  post:
 *     tags:
 *      - WorkingCalendar
 *     summary: Get working calendar by id
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              id:
 *                type: objectId
 *                example: ''
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
router.post('/getById', GetAccessToken('workingCalendar', 'view'), WorkingCalendarController.getById);
/**
 * @openapi
 * '/api/workingCalendar/getWorkingCalendar':
 *  post:
 *     tags:
 *      - WorkingCalendar
 *     summary: Get working calendar
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              dateF:
 *                type: date
 *                example: '2023-12-17T10:57:41.689Z'
 *              statusF:
 *                type: array
 *                example: ["new","arrived","completed"]
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
router.post('/getWorkingCalendar', GetAccessToken('workingCalendar', 'view'), WorkingCalendarController.getWorkingCalendar);

module.exports = router;
