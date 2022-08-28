const express = require('express');
const multer = require('../middlewares/Multer');
const userController = require('../controllers/UserController');
const router = express.Router();

router.post('/create', multer.single('imageFile'), userController.create);
router.put('/update', multer.single('imageFile'), userController.update);
router.get('/getById/:id/', userController.getById);
router.post('/getByQuery', userController.getByQuery);

module.exports = router;