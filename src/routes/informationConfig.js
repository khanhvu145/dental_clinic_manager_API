const express = require('express');
const InformationConfigController = require('../controllers/InformationConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const multer = require('../middlewares/Multer');
const router = express.Router();

router.post('/createUpdate', GetAccessToken('informationConfig', 'update'), multer.single('imageFile'), InformationConfigController.createUpdate);
router.get('/getData', verifyToken, InformationConfigController.getData);

module.exports = router;