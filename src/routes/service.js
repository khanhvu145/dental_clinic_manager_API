const express = require('express');
const serviceController = require('../controllers/ServiceController');
const router = express.Router();

router.post('/create', serviceController.create);
router.post('/getByQuery', serviceController.getByQuery);
router.get('/getById/:id/', serviceController.getById);
router.put('/update', serviceController.update);
router.post('/groupCreate', serviceController.groupCreate);
router.post('/groupGetByQuery', serviceController.groupGetByQuery);
router.get('/groupGetById/:id/', serviceController.groupGetById);
router.put('/groupUpdate', serviceController.groupUpdate);

module.exports = router;