const express = require('express');
const generalConfigController = require('../controllers/GeneralConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/update', GetAccessToken('generalconfig', 'update'), generalConfigController.update);
router.post('/getByQuery', verifyToken, generalConfigController.getByQuery);

module.exports = router;