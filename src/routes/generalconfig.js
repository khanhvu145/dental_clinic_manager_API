const express = require('express');
const generalConfigController = require('../controllers/GeneralConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

/**
 * @openapi
 * '/api/generalconfig/update':
 *  post:
 *     tags:
 *      - GeneralConfig
 *     summary: Create/update general config
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                  _id:
 *                      type: objectId
 *                      example: ''
 *                  type:
 *                      type: string
 *                      example: ''
 *                  value:
 *                      type: string
 *                      example: ''
 *                  color:
 *                      type: string
 *                      example: ''
 *                  isActive:
 *                      type: boolean
 *                      example: true
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
router.post('/update', GetAccessToken('generalconfig', 'update'), generalConfigController.update);
/**
 * @openapi
 * '/api/generalconfig/getByQuery':
 *  post:
 *     tags:
 *      - GeneralConfig
 *     summary: Get general config by query
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              type:
 *                type: string
 *                example: ''
 *              isActive:
 *                type: boolean
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
router.post('/getByQuery', verifyToken, generalConfigController.getByQuery);

module.exports = router;