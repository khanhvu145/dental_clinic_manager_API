const express = require('express');
const serviceController = require('../controllers/ServiceController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const router = express.Router();

router.post('/create', GetAccessToken('service', 'create'), serviceController.create);
router.post('/getByQuery', GetAccessToken('service', 'view'), serviceController.getByQuery);
router.get('/getById/:id/', serviceController.getById);
router.put('/update', GetAccessToken('service', 'update'), serviceController.update);
router.post('/groupCreate', GetAccessToken('service', 'create'), serviceController.groupCreate);
router.post('/groupGetByQuery', GetAccessToken('service', 'view'), serviceController.groupGetByQuery);
router.get('/groupGetById/:id/', serviceController.groupGetById);
router.put('/groupUpdate', GetAccessToken('service', 'update'), serviceController.groupUpdate);

module.exports = router;