const express = require('express');
const accessGroupController = require('../controllers/AccessGroupController');
const router = express.Router();

router.put('/update', accessGroupController.update);
router.post('/create', accessGroupController.create);
router.get('/getById/:id/', accessGroupController.getById);
router.post('/getByQuery', accessGroupController.getByQuery);

module.exports = router;