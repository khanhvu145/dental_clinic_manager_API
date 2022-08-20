const express = require('express');
const multer = require('../middlewares/Multer');
const employeeController = require('../controllers/EmployeeController');
const router = express.Router();

router.post('/uploadFile', multer.single('imageFile'), employeeController.uploadFile);
// router.get('/listPosition', employeeController.listPosition);
router.get('/getById/:id/', employeeController.getById);
router.post('/createEmployee', multer.single('imageFile'), employeeController.createEmployee);
router.get('/getListEmployee', employeeController.getListEmployee);

module.exports = router;