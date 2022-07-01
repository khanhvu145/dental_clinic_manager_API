const Employee = require('../models/Employee');
const Account = require('../models/Account');
const Position = require('../models/Position');

const EmployeeController = {
    listPosition: async(req, res) => {
        try {
            const positions = await Position.find({});
            res.status(200).json({success: true, data : positions });
        }catch(err){
            res.status(500).json(err)
        }
    },
    getListEmployee: async(req, res) => {
        try {
            const employees = await Employee.find({});
            res.status(200).json({success: true, data : employees});
        }catch(err){
            res.status(500).json(err)
        }
    },
    createEmployee: async(req, res) => {
        try{
            const newEmployee = await new Employee({

            });
            const newAccount = await new Account({

            });

            const saveEmployee = await newEmployee.save();
            const saveAccount = await newAccount.save();
            
            res.status(200).json({ success: true, employee: saveEmployee, account: saveAccount });
        }catch(err){
            res.status(500).json(err)
        }
    }
}

module.exports = EmployeeController;