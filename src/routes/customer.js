const express = require('express');
const multer = require('../middlewares/Multer');
const customerController = require('../controllers/CustomerController');
const router = express.Router();

router.post('/create', multer.single('imageFile'), customerController.create);
router.put('/update', multer.single('imageFile'), customerController.update);
router.get('/getById/:id/', customerController.getById);
router.post('/getByQuery', customerController.getByQuery);

module.exports = router;