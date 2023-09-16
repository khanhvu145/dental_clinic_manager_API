const express = require('express');
const accessGroupController = require('../controllers/AccessGroupController');
const GetAccessToken = require('../middlewares/GetAccessToken');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.put('/update', GetAccessToken('accessgroup', 'update'), accessGroupController.update);
router.post('/create', GetAccessToken('accessgroup', 'create'), accessGroupController.create);
router.get('/getById/:id/', verifyToken, accessGroupController.getById);
router.post('/getByQuery', GetAccessToken('accessgroup', 'view'), accessGroupController.getByQuery);

module.exports = router;