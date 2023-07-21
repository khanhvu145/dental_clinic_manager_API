const express = require('express');
const receiptsController = require('../controllers/ReceiptsController');
const router = express.Router();

router.post('/getByQuery', receiptsController.getByQuery);

module.exports = router;