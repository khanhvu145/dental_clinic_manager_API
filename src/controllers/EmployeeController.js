const Employee = require('../models/Employee');
const Account = require('../models/Account');
const Position = require('../models/Position');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const firebaseDB = require('../helpers/firebase');
const uploadFile = require('../helpers/uploadFile');
const getFileUpload = require('../helpers/getFileUpload');
const moment = require('moment');

const EmployeeController = {
    // listPosition: async(req, res) => {
    //     try {
    //         const positions = await Position.find({});
    //         res.status(200).json({success: true, data : positions });
    //     }catch(err){
    //         res.status(500).json(err)
    //     }
    // },
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
            let isChecked = true;
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            //Họ tên
            if(formData.name == null || formData.name == '') {
                isChecked = false;
                res.status(500).json({ success: false, error: "Hãy nhập họ và tên" });
            }
            //CMND/CCCD
            if(formData.physicalId == null || formData.physicalId == '') {
                isChecked = false;
                res.status(500).json({ success: false, error: "Hãy nhập CMND/CCCD" });
            }
            //Username
            if(formData.username == null || formData.username == '') {
                isChecked = false;
                res.status(500).json({ success: false, error: "Hãy nhập tên tài khoản" });
            }
            //password
            if(formData.password == null || formData.password == '') {
                isChecked = false;
                res.status(500).json({ success: false, error: "Hãy nhập mật khẩu" });
            }
            //Số điện thoại
            if(formData.phone == null || formData.phone == '') {
                isChecked = false;
                res.status(500).json({ success: false, error: "Hãy nhập số điện thoại" });
            }
            else {
                var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
                var phone = formData.phone;
                if(!vnf_regex.test(phone)){
                    isChecked = false;
                    res.status(500).json({ success: false, error: "Số điện thoại không đúng định dạng" });
                }
            }
            //Email
            if(formData.email != null && formData.email != '') {
                var email = formData.email; 
                var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/; 
                if (!filter.test(email)) { 
                    isChecked = false;
                    res.status(500).json({ success: false, error: "Email không đúng định dạng" });
                }
            }
            //
            // if(formData.position == null || formData.position == '') {
            //     isChecked = false;
            //     res.status(500).json({ success: false, error: "Hãy chọn chức vụ" });
            // }
            //Nhóm người dùng
            if(formData.roleId == null || formData.roleId == '') {
                isChecked = false;
                res.status(500).json({ success: false, error: "Hãy chọn quyền tài khoản" });
            }
            //Xử lý
            if(isChecked){
                var count = await Employee.count({});
                var number = (count + 1).toString();
                var code = 'EMP-' + number.padStart(4, '0');
                //Xử lý upload file
                if(req.file){
                    var fileName = Date.now().toString() + '-' + req.file.originalname;
                    var path = firebaseDB.bucket.file('employees/' + code + '/' + fileName);
                    var buffer = req.file.buffer;
                    var image = await uploadFile(path, buffer);
                    var fileURL = await getFileUpload(path);
                    formData.img = fileURL[0];
                }

                const newEmployee = await new Employee({
                    code: code,
                    name: formData.name, 
                    physicalId: formData.physicalId,
                    dateOfIssue: formData.dateOfIssue ? formData.dateOfIssue : '',
                    placeOfIssue: formData.placeOfIssue ? formData.placeOfIssue : '',
                    email: formData.email ? formData.email : '',
                    phone: formData.phone,
                    birthday: formData.birthday ? formData.birthday : '',
                    gender: formData.gender ? formData.gender : '',
                    "address.building": formData.address.building ? formData.address.building : '',
                    "address.wardId": formData.address.wardId ? formData.address.wardId : 0,
                    "address.districtId": formData.address.districtId ? formData.address.districtId : 0,
                    "address.provinceId": formData.address.provinceId ? formData.address.provinceId : 0,
                    img: formData.img ? formData.img : '',
                    imageFile: formData.imageFile ? formData.imageFile : null,
                    isActive: formData.isActive ? formData.isActive : true,
                });
                const saveEmployee = await newEmployee.save();
    
                var saveAccount = {};
                if(saveEmployee){
                    const newAccount = await new Account({
                        username: formData.username, 
                        password: bcrypt.hashSync(formData.password, salt),
                        employeeId: saveEmployee._id,
                        roleId: formData.roleId,
                        isActive: formData.isActive ? formData.isActive : true,
                    });
                    saveAccount = await newAccount.save();
                }
                res.status(200).json({ success: true, employee: saveEmployee, account: saveAccount });
            }
            else{
                res.status(500).json({ success: false, error: "Tạo dữ liệu không thành công" });
            }
        }catch(err){
            res.status(500).json(err);
        }
    },
    getById: async(req, res) => {
        try {
            const employee = await Employee.findById(req.params.id);
            const account = await Account.findOne({ employeeId: req.params.id })
            // account.password = 
            res.status(200).json({success: true, employee: employee, account: account});
        }catch(err){
            res.status(500).json(err)
        }
    },
    uploadFile: async(req, res) =>{
        var formData = req.body;
        // const image = await firebaseDB.bucket.file("employees/" + req.file.originalname).createWriteStream().end(req.file.buffer);
        // const url = await firebaseDB.bucket.file("employees/" + req.file.originalname).getSignedUrl({
        //     version: 'v2',
        //     action: 'read',
        //     expires: Date.now() + 1000 * 60 * 60
        // });
        // var url = "";
        var path = firebaseDB.bucket.file('employees/' + req.file.originalname);
        var buffer = req.file.buffer;
        var data = await uploadFile(path, buffer);
        var url = await getFileUpload(path);
        res.status(200).json({ success: true, data: data, file: url });
    }
}

module.exports = EmployeeController;