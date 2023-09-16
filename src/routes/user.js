const express = require('express');
const multer = require('../middlewares/Multer');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const userController = require('../controllers/UserController');
const router = express.Router();

router.post('/create', GetAccessToken('users', 'create'), multer.single('imageFile'), userController.create);
router.put('/update', GetAccessToken('users', 'update'), multer.single('imageFile'), userController.update);
router.get('/getById/:id/', verifyToken, userController.getById);
router.post('/getByQuery', GetAccessToken('users', 'view'), userController.getByQuery);
router.get('/getDentist', verifyToken, userController.getDentist);
router.post('/getDentistByQuery', verifyToken, userController.getDentistByQuery);

module.exports = router;