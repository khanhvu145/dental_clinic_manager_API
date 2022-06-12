const Account = require('../models/Account');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

const AccountController = {
    login: async(req, res) => {
        try {
            const account = await Account.find({ username: req.body.username, password: req.body.password });
            var token = jwt.sign({account}, 'secretKey');
            if(account){
                res.status(200).json({ success: true, data: { token: token } });
            }
            else{
                res.status(200).json({ success: false, data: '' });
            }
        }catch(err){
            res.status(500).json(err)
        }
    },
    info: async (req, res) => {
        try{
            var accountData = jwt.verify(req.token, 'secretKey');
            const employeeId = accountData.account[0].employeeId;
            const employeeData = await Employee.find({ _id: employeeId });
            res.status(200).json({ success: true, data : employeeData[0] });
        }catch(err){
            res.status(500).json(err)
        }
    }
}

module.exports = AccountController;