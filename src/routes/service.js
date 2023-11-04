const express = require('express');
const serviceController = require('../controllers/ServiceController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

/**
 * @openapi
 * '/api/service/create':
 *  post:
 *     tags:
 *      - Service
 *     summary: Create new service
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
 *              - code
 *              - groupId
 *            properties:
 *              name:
 *                type: string
 *                example: Implant Mỹ
 *              code:
 *                type: string
 *                example: SV001
 *              groupId:
 *                type: objectId
 *                example: 635dcdca8767db1c0783f63f
 *              price:
 *                type: number
 *                example: 1000000
 *              unit:
 *                type: string
 *                example: unit1
 *              description:
 *                type: string
 *                example: ''
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
router.post('/create', GetAccessToken('service', 'create'), serviceController.create);
/**
 * @openapi
 * '/api/service/update':
 *  put:
 *     tags:
 *      - Service
 *     summary: Update service
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
 *              - code
 *              - groupId
 *            properties:
 *              _id:
 *                type: objectId
 *                example: 646981410920e510ac888e1f
 *              name:
 *                type: string
 *                example: Implant Mỹ
 *              code:
 *                type: string
 *                example: SV001
 *              groupId:
 *                type: objectId
 *                example: 635dcdca8767db1c0783f63f
 *              price:
 *                type: number
 *                example: 1000000
 *              unit:
 *                type: string
 *                example: unit1
 *              description:
 *                type: string
 *                example: ''
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
router.put('/update', GetAccessToken('service', 'update'), serviceController.update);
/**
 * @openapi
 * '/api/service/getByQuery':
 *  post:
 *     tags:
 *      - Service
 *     summary: Get service by query
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
 *                  groupF: ''
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
router.post('/getByQuery', verifyToken, serviceController.getByQuery);
/**
 * @openapi
 * '/api/service/getById/{id}':
 *  get:
 *     tags:
 *      - Service
 *     summary: Get service by id
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        type: objectId
 *        required: true
 *        example: 63086dcfc9640693430cc2a3
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
router.get('/getById/:id/', verifyToken, serviceController.getById);
/**
 * @openapi
 * '/api/service/groupCreate':
 *  post:
 *     tags:
 *      - Service
 *     summary: Create new service group
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
 *              - code
 *            properties:
 *              name:
 *                type: string
 *                example: Niềng răng 
 *              code:
 *                type: string
 *                example: SVG001
 *              description:
 *                type: string
 *                example: ''
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
router.post('/groupCreate', GetAccessToken('service', 'create'), serviceController.groupCreate);
/**
 * @openapi
 * '/api/service/groupUpdate':
 *  put:
 *     tags:
 *      - Service
 *     summary: Update service group
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
 *              - code
 *            properties:
 *              _id:
 *                type: objectId
 *                example: 646981410920e510ac888e1f
 *              name:
 *                type: string
 *                example: Implant
 *              code:
 *                type: string
 *                example: SV001
 *              description:
 *                type: string
 *                example: ''
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
router.put('/groupUpdate', GetAccessToken('service', 'update'), serviceController.groupUpdate);
/**
 * @openapi
 * '/api/service/groupGetByQuery':
 *  post:
 *     tags:
 *      - Service
 *     summary: Get service group by query
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
router.post('/groupGetByQuery', verifyToken, serviceController.groupGetByQuery);
/**
 * @openapi
 * '/api/service/groupGetById/{id}':
 *  get:
 *     tags:
 *      - Service
 *     summary: Get service group by id
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        type: objectId
 *        required: true
 *        example: 63086dcfc9640693430cc2a3
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
router.get('/groupGetById/:id/', verifyToken, serviceController.groupGetById);
/**
 * @openapi
 * '/api/service/groupGetByTextSearch':
 *  post:
 *     tags:
 *      - Service
 *     summary: Get service group by text search
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
router.post('/groupGetByTextSearch', verifyToken, serviceController.groupGetByTextSearch);

module.exports = router;