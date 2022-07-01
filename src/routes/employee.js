const express = require('express');
const employeeController = require('../controllers/EmployeeController');
const router = express.Router();

router.post('/createEmployee', employeeController.createEmployee);
router.get('/getListEmployee', employeeController.getListEmployee);

module.exports = router;