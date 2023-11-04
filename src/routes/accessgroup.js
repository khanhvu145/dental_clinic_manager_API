const express = require('express');
const accessGroupController = require('../controllers/AccessGroupController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

/**
 * @openapi
 * '/api/accessgroup/create':
 *  post:
 *     tags:
 *      - Accessgroup
 *     summary: Create new access group
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
 *                example: Nhóm quyền nha sĩ
 *              note:
 *                type: string
 *                example: Nhóm quyền dành cho nha sĩ
 *              accesses:
 *                type: array
 *                example: [
 *                  customer.all,
 *                  appointment.all
 *                ]
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
router.post('/create', GetAccessToken('accessgroup', 'create'), accessGroupController.create);
/**
 * @openapi
 * '/api/accessgroup/update':
 *  put:
 *     tags:
 *      - Accessgroup
 *     summary: Update access group
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
 *            properties:
 *              _id:
 *                type: objectId
 *                example: 63086dcfc9640693430cc2a3
 *              name:
 *                type: string
 *                example: Nhóm quyền nha sĩ
 *              note:
 *                type: string
 *                example: Nhóm quyền dành cho nha sĩ
 *              accesses:
 *                type: array
 *                example: [
 *                  customer.all,
 *                  appointment.all
 *                ]
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
router.put('/update', GetAccessToken('accessgroup', 'update'), accessGroupController.update);
/**
 * @openapi
 * '/api/accessgroup/getByQuery':
 *  post:
 *     tags:
 *      - Accessgroup
 *     summary: Get accessgroup by query
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
router.post('/getByQuery', GetAccessToken('accessgroup', 'view'), accessGroupController.getByQuery);
/**
 * @openapi
 * '/api/accessgroup/getById/{id}':
 *  get:
 *     tags:
 *      - Accessgroup
 *     summary: Get accessgroup by id
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
router.get('/getById/:id/', verifyToken, accessGroupController.getById);

module.exports = router;