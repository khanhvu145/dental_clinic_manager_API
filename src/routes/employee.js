const express = require('express');
const employeeController = require('../controllers/EmployeeController');
const router = express.Router();

router.post('/getListEmployee', employeeController.getListEmployee);

module.exports = router;