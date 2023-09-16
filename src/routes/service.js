const express = require('express');
const serviceController = require('../controllers/ServiceController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/create', GetAccessToken('service', 'create'), serviceController.create);
router.post('/getByQuery', verifyToken, serviceController.getByQuery);
router.get('/getById/:id/', verifyToken, serviceController.getById);
router.put('/update', GetAccessToken('service', 'update'), serviceController.update);
router.post('/groupCreate', GetAccessToken('service', 'create'), serviceController.groupCreate);
router.post('/groupGetByQuery', verifyToken, serviceController.groupGetByQuery);
router.get('/groupGetById/:id/', verifyToken, serviceController.groupGetById);
router.put('/groupUpdate', GetAccessToken('service', 'update'), serviceController.groupUpdate);

module.exports = router;