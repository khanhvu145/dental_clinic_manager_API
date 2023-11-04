const express = require('express');
const multer = require('../middlewares/Multer');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const userController = require('../controllers/UserController');
const router = express.Router();

/**
 * @openapi
 * '/api/user/getByQuery':
 *  post:
 *     tags:
 *      - User
 *     summary: Get user by query
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
 *                  nameF: ''
 *                  usernameF: ''
 *                  statusF: true
 *              sorts:
 *                type: string
 *                example: createdAt&&-1
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
router.post('/getByQuery', GetAccessToken('users', 'view'), userController.getByQuery);
/**
 * @openapi
 * '/api/user/getById/{id}':
 *  get:
 *     tags:
 *      - User
 *     summary: Get user by query
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
router.get('/getById/:id/', verifyToken, userController.getById);
/**
 * @openapi
 * '/api/user/create':
 *  post:
 *     tags:
 *      - User
 *     summary: Create new user
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
 *              - physicalId
 *              - username
 *              - password
 *              - phone
 *              - accessId
 *            properties:
 *              username:
 *                type: string
 *                example: khanhvn1405
 *              password:
 *                type: string
 *                example: khanh1405
 *              name:
 *                type: string
 *                example: Vũ Nhật Khanh
 *              physicalId:
 *                type: string
 *                example: 079200007270
 *              dateOfIssue:
 *                type: date
 *                example: 2018/05/14
 *              placeOfIssue:
 *                type: string
 *                example: Thủ Đức
 *              email:
 *                type: string
 *                example: khanhvn14052000@gmail.com
 *              phone:
 *                type: string
 *                example: 0703260457
 *              birthday:
 *                type: date
 *                example: 2000/05/14
 *              gender:
 *                type: string
 *                example: male
 *              address:
 *                type: object
 *                example: 
 *                  building: 45 Tam Hà
 *                  wardId: 26806
 *                  districtId: 769
 *                  provinceId: 79
 *              accessId:
 *                type: objectId
 *                example: 6304ded0b6f476a50023ed82
 *              isDentist:
 *                type: bool
 *                example: true
 *              isAccountant:
 *                type: bool
 *                example: false
 *              isActive:
 *                type: bool
 *                example: true
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
router.post('/create', GetAccessToken('users', 'create'), multer.single('imageFile'), userController.create);
/**
 * @openapi
 * '/api/user/update':
 *  post:
 *     tags:
 *      - User
 *     summary: Update user
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - _id
 *              - name
 *              - physicalId
 *              - phone
 *              - accessId
 *            properties:
 *              _id:
 *                type: objectId
 *                example: 630a038c4b0253de39d18206
 *              name:
 *                type: string
 *                example: Vũ Nhật Khanh
 *              physicalId:
 *                type: string
 *                example: 079200007270
 *              dateOfIssue:
 *                type: date
 *                example: 2018/05/14
 *              placeOfIssue:
 *                type: string
 *                example: Thủ Đức
 *              email:
 *                type: string
 *                example: khanhvn14052000@gmail.com
 *              phone:
 *                type: string
 *                example: 0703260457
 *              birthday:
 *                type: date
 *                example: 2000/05/14
 *              gender:
 *                type: string
 *                example: male
 *              address:
 *                type: object
 *                example: 
 *                  building: 45 Tam Hà
 *                  wardId: 26806
 *                  districtId: 769
 *                  provinceId: 79
 *              accessId:
 *                type: objectId
 *                example: 6304ded0b6f476a50023ed82
 *              isDentist:
 *                type: bool
 *                example: true
 *              isAccountant:
 *                type: bool
 *                example: false
 *              isActive:
 *                type: bool
 *                example: true
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
router.put('/update', GetAccessToken('users', 'update'), multer.single('imageFile'), userController.update);
/**
 * @openapi
 * '/api/user/getDentistByQuery':
 *  post:
 *     tags:
 *      - User
 *     summary: Get dentists by query
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - filters
 *              - sorts
 *              - pages
 *            properties:
 *              filters:
 *                type: object
 *                example:
 *                  textSearch: ''
 *              sorts:
 *                type: string
 *                example: createdAt&&-1
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
router.post('/getDentistByQuery', verifyToken, userController.getDentistByQuery);
/**
 * @openapi
 * '/api/user/getDentist':
 *  get:
 *     tags:
 *      - User
 *     summary: Get all dentists
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
router.get('/getDentist', verifyToken, userController.getDentist);
router.post('/updateSeenStatusAll', verifyToken, userController.updateSeenStatusAll);
router.post('/updateSeenStatus', verifyToken, userController.updateSeenStatus);
router.post('/getNotifyByQuery', verifyToken, userController.getNotifyByQuery);

module.exports = router;