const Employee = require('../models/Employee');

const EmployeeController = {
    getListEmployee: async(req, res) => {
        try {
            // const employees = await Employee.find({_id: req.body.id});
            await Employee.findByIdAndRemove(req.body.id);
            res.status(200).json("true");
        }catch(err){
            res.status(500).json(err)
        }
    }
}

module.exports = EmployeeController;