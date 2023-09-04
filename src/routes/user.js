const express = require('express');
const multer = require('../middlewares/Multer');
const GetAccessToken = require('../middlewares/GetAccessToken');
const userController = require('../controllers/UserController');
const router = express.Router();

router.post('/create', GetAccessToken('users', 'create'), multer.single('imageFile'), userController.create);
router.put('/update', GetAccessToken('users', 'update'), multer.single('imageFile'), userController.update);
router.get('/getById/:id/', userController.getById);
router.post('/getByQuery', GetAccessToken('users', 'view'), userController.getByQuery);
router.get('/getDentist', userController.getDentist);
router.post('/getDentistByQuery', userController.getDentistByQuery);

module.exports = router;