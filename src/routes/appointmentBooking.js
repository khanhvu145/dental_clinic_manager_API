const express = require('express');
const appointmentBookingController = require('../controllers/AppointmentBookingController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

/**
 * @openapi
 * '/api/appointmentBooking/cancelBooking':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Cancel appointment
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              ids:
 *                type: array
 *                example: []
 *              cancelReason:
 *                 type: string
 *                 example: ''
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
router.post('/cancelBooking', GetAccessToken('appointment', 'cancelBooking'), appointmentBookingController.cancelBooking);
/**
 * @openapi
 * '/api/appointmentBooking/completeBooking':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Complete appointment
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              ids:
 *                type: array
 *                example: []
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
router.post('/completeBooking', GetAccessToken('appointment', 'completeBooking'), appointmentBookingController.completeBooking);
/**
 * @openapi
 * '/api/appointmentBooking/confirmBooking':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Confirm appointment
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              ids:
 *                type: array
 *                example: []
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
router.post('/confirmBooking', GetAccessToken('appointment', 'confirmBooking'), appointmentBookingController.confirmBooking);
/**
 * @openapi
 * '/api/appointmentBooking/sendMail':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Send mail customer of appointment
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              ids:
 *                type: array
 *                example: []
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
router.post('/sendMail', GetAccessToken('appointment', 'sendMail'), appointmentBookingController.sendMail);
/**
 * @openapi
 * '/api/appointmentBooking/getLogs/{id}':
 *  get:
 *     tags:
 *      - AppointmentBooking
 *     summary: Get appointment log
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        type: objectId
 *        required: true
 *        example: 64fb6b5e013e88cefce199d5
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
router.get('/getLogs/:id/', GetAccessToken('appointment', 'view'), appointmentBookingController.getLogs);
/**
 * @openapi
 * '/api/appointmentBooking/update':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Update appointment
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - dentistId
 *              - date
 *              - timeFrom
 *              - timeTo
 *              - content
 *            properties:
 *              content:
 *                type: objectId
 *              date:
 *                type: date
 *              dentistId:
 *                type: objectId
 *              note:
 *                type: string
 *              session:
 *                type: string
 *              timeFrom:
 *                type: string
 *              timeTo:
 *                type: string
 *              type:
 *                type: objectId
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
router.post('/update', GetAccessToken('appointment', 'update'), appointmentBookingController.update);
/**
 * @openapi
 * '/api/appointmentBooking/getById':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Get appointment by id
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
 *                example: '64fb6b5e013e88cefce199d5'
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
router.post('/getById', GetAccessToken('appointment', 'view'), appointmentBookingController.getById);
/**
 * @openapi
 * '/api/appointmentBooking/getByQuery':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Get appointment by query
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
 *                  codeF: ''
 *                  customersF: ''
 *                  dateF: ["2023-12-16T17:00:00.000Z","2023-12-17T16:59:59.999Z"]
 *                  dentistsF: []
 *                  statusF: ["new","arrived","completed"]
 *              sorts:
 *                type: string
 *                example: dateTimeFrom&&1
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
router.post('/getByQuery', GetAccessToken('appointment', 'view'), appointmentBookingController.getByQuery);
/**
 * @openapi
 * '/api/appointmentBooking/getEmptyCalendar':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Get empty calendar
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              currentId:
 *                type: objectId
 *              dateF:
 *                type: date
 *              dentistsF:
 *                type: array
 *                example: []
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
router.post('/getEmptyCalendar', GetAccessToken('appointment', 'view'), appointmentBookingController.getEmptyCalendar);
/**
 * @openapi
 * '/api/appointmentBooking/updateStatusToNoArrivedJob':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Update status to no arrived
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
router.post('/updateStatusToNoArrivedJob', appointmentBookingController.updateStatusToNoArrivedJob);
/**
 * @openapi
 * '/api/appointmentBooking/create':
 *  post:
 *     tags:
 *      - AppointmentBooking
 *     summary: Create new appointment
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - mainCustomer
 *              - dentistId
 *              - date
 *              - timeFrom
 *              - timeTo
 *              - content
 *            properties:
 *              content:
 *                type: objectId
 *              date:
 *                type: date
 *              dentistId:
 *                type: objectId
 *              mainCustomer:
 *                type: object
 *              note:
 *                type: string
 *              session:
 *                type: string
 *              status:
 *                type: string
 *              timeFrom:
 *                type: string
 *              timeTo:
 *                type: string
 *              type:
 *                type: objectId
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
router.post('/create', GetAccessToken('appointment', 'create'), appointmentBookingController.create);

module.exports = router;
