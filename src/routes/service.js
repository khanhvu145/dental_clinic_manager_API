const express = require('express');
const serviceController = require('../controllers/ServiceController');
const router = express.Router();

router.post('/create', serviceController.create);
router.post('/getByQuery', serviceController.getByQuery);
router.get('/getById/:id/', serviceController.getById);
router.put('/update', serviceController.update);

module.exports = router;