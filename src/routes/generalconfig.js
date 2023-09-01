const express = require('express');
const generalConfigController = require('../controllers/GeneralConfigController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/update', GetAccessToken('generalconfig', 'update'), generalConfigController.update);
router.post('/getByQuery', GetAccessToken('generalconfig', 'view'), generalConfigController.getByQuery);

module.exports = router;