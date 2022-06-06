const Employee = require('../models/Employee');

const EmployeeController = {
    getListEmployee: async(req, res) => {
        try {
            const employees = await Employee.find({});
            res.status(200).json(employees);
        }catch(err){
            res.status(500).json(err)
        }
    }
}

module.exports = EmployeeController;