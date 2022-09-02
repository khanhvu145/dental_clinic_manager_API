const express = require('express');
const generalConfigController = require('../controllers/GeneralConfigController');
const router = express.Router();

router.post('/update', generalConfigController.update);
router.post('/getByQuery', generalConfigController.getByQuery);

module.exports = router;