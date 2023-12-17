const express = require('express');
const accountController = require('../controllers/AccountController');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

/**
 * @openapi
 * '/api/account/login':
 *  post:
 *     tags:
 *     - Account
 *     summary: Login
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - username
 *              - password
 *            properties:
 *              username:
 *                type: string
 *                description: Tài khoản  
 *                example: khanhvn1405
 *              password:
 *                type: string
 *                description: Mật khẩu  
 *                example: khanh1405
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
router.post('/login', accountController.login);
/**
 * @openapi
 * '/api/account/info':
 *  get:
 *     tags:
 *      - Account
 *     summary: Get info account
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
router.get('/info', verifyToken, accountController.info);
/**
 * @openapi
 * '/api/account/resetPassword':
 *  post:
 *     tags:
 *      - Account
 *     summary: Reset password
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - currentPassword
 *              - newPassword
 *              - confirmPassword
 *            properties:
 *              currentPassword:
 *                type: string
 *                description: Mật khẩu hiện tại 
 *                example: khanh1405
 *              newPassword:
 *                type: string
 *                description: Mật khẩu mới  
 *                example: khanh1405
 *              confirmPassword:
 *                type: string
 *                description: Xác nhận mật khẩu
 *                example: khanh1405
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
router.post('/resetPassword', verifyToken, accountController.resetPassword);
/**
 * @openapi
 * '/api/account/forgotPassword':
 *  post:
 *     tags:
 *      - Account
 *     summary: Forgot password
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - username
 *            properties:
 *              username:
 *                type: string
 *                description: Tài khoản người dùng
 *                example: khanhvn1405
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
router.post('/forgotPassword', accountController.forgotPassword);

module.exports = router;