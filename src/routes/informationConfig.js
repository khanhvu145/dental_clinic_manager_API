const express = require('express');
const InformationConfigController = require('../controllers/InformationConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const multer = require('../middlewares/Multer');
const router = express.Router();

/**
 * @openapi
 * '/api/informationConfig/createUpdate':
 *  post:
 *     tags:
 *      - InformationConfig
 *     summary: Create/update information config
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
 *            properties:
 *              name:
 *                type: string
 *                example: ''
 *              address:
 *                type: string
 *                example: ''
 *              phone:
 *                type: string
 *                example: ''
 *              email:
 *                type: string
 *                example: ''
 *              website:
 *                type: string
 *                example: ''
 *              imageFile:
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
router.post('/createUpdate', GetAccessToken('informationConfig', 'update'), multer.single('imageFile'), InformationConfigController.createUpdate);
/**
 * @openapi
 * '/api/informationConfig/getData':
 *  get:
 *     tags:
 *      - InformationConfig
 *     summary: Get information config data
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
router.get('/getData', verifyToken, InformationConfigController.getData);

module.exports = router;