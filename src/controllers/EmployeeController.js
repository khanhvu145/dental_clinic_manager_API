const Employee = require('../models/Employee');
const Account = require('../models/Account');

const EmployeeController = {
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