const User = require('../models/tw_User');
const Notification = require('../models/tw_Notification');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const firebaseDB = require('../helpers/firebase');
const uploadFile = require('../helpers/uploadFile');
const getFileUpload = require('../helpers/getFileUpload');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const UserController = {
    create: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            //Họ tên
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập họ và tên" });
            }
            //CMND/CCCD
            if(formData.physicalId == null || formData.physicalId == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập CMND/CCCD" });
            }
            //username
            if(formData.username == null || formData.username == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên tài khoản" });
            }
            //password
            if(formData.password == null || formData.password == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mật khẩu" });
            }
            //Số điện thoại
            if(formData.phone == null || formData.phone == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập số điện thoại" });
            }
            else {
                var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
                var phone = formData.phone;
                if(!vnf_regex.test(phone)){
                    return res.status(200).json({ success: false, error: "Số điện thoại không đúng định dạng" });
                }
            }
            //Email
            if(formData.email != null && formData.email != '') {
                var email = formData.email; 
                var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/; 
                if (!filter.test(email)) { 
                    return res.status(200).json({ success: false, error: "Email không đúng định dạng" });
                }
            }
            //Nhóm người dùng
            if(formData.accessId == null || formData.accessId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nhóm người dùng" });
            }

            //Xử lý
            var exists = await User.findOne({ 
                $or: [
                    { username: formData.username  },
                    { physicalId: formData.physicalId }
                ]
            });
            if(exists == null) {
                //Xử lý upload file
                if(req.file){
                    var fileName = Date.now().toString() + '-' + req.file.originalname;
                    var path = firebaseDB.bucket.file('users/' + formData.username + '/' + fileName);
                    var buffer = req.file.buffer;
                    var image = await uploadFile(path, buffer);
                    var fileURL = await getFileUpload(path);
                    formData.img = fileURL[0];
                }
                //Lưu dữ liệu
                const newData = await new User({
                    username: formData.username.trim(), 
                    password: bcrypt.hashSync(formData.password.trim(), salt),
                    name: formData.name, 
                    physicalId: formData.physicalId,
                    dateOfIssue: formData.dateOfIssue ? formData.dateOfIssue : null,
                    placeOfIssue: formData.placeOfIssue ? formData.placeOfIssue : '',
                    email: formData.email ? formData.email : '',
                    phone: formData.phone,
                    birthday: formData.birthday ? formData.birthday : null,
                    gender: formData.gender ? formData.gender : '',
                    "address.building": formData.address.building ? formData.address.building : '',
                    "address.wardId": formData.address.wardId ? parseInt(formData.address.wardId, 10) : null,
                    "address.districtId": formData.address.districtId ? parseInt(formData.address.districtId, 10) : null,
                    "address.provinceId": formData.address.provinceId ? parseInt(formData.address.provinceId, 10) : null,
                    img: formData.img ? formData.img : '',
                    imageFile: null,
                    accessId: formData.accessId,
                    // position: formData.position ? formData.position : '',
                    isDentist: formData.isDentist,
                    isActive: formData.isActive ? formData.isActive : true,
                    createdAt: Date.now(),
                    createdBy: req.username ? req.username : ''
                }).save();
                await User.updateOne(
                    { _id: newData._id }, 
                    {
                        $set: { 
                            code: 'EMP-' + newData._id.toString().slice(-5).toUpperCase()
                        }
                    }
                );
                var data = await User.findById(newData._id);
                return res.status(200).json({ success: true, message: 'Tạo thành công', data: data });
            }
            else{
                return res.status(200).json({ success: false, error: 'Người dùng đã tồn tại' });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getById: async(req, res) => {
        try{
            const data = await User.findById(req.params.id);
            if(data) {
                var newData = {
                    _id: data._id,
                    username: data.username,
                    code: data.code,
                    name: data.name, 
                    physicalId: data.physicalId,
                    dateOfIssue: data.dateOfIssue,
                    placeOfIssue: data.placeOfIssue,
                    email: data.email,
                    phone: data.phone,
                    birthday: data.birthday,
                    gender: data.gender,
                    address: {
                        "building": data.address.building,
                        "wardId": parseInt(data.address.wardId, 10),
                        "districtId": parseInt(data.address.districtId, 10),
                        "provinceId": parseInt(data.address.provinceId, 10),
                    },
                    // position: data.position,
                    img: data.img,
                    imageFile: null,
                    accessId: data.accessId,
                    isDentist: data.isDentist,
                    isActive: data.isActive,
                };
                return res.status(200).json({ success: true, data: newData });
            }
            else{
                return res.status(400).json({success: false, error: 'Không có thông tin người dùng'});
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    update: async(req, res) => {
        try {
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            //Họ tên
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập họ và tên" });
            }
            //CMND/CCCD
            if(formData.physicalId == null || formData.physicalId == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập CMND/CCCD" });
            }
            //Số điện thoại
            if(formData.phone == null || formData.phone == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập số điện thoại" });
            }
            else {
                var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
                var phone = formData.phone;
                if(!vnf_regex.test(phone)){
                    return res.status(200).json({ success: false, error: "Số điện thoại không đúng định dạng" });
                }
            }
            //Email
            if(formData.email != null && formData.email != '') {
                var email = formData.email; 
                var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/; 
                if (!filter.test(email)) { 
                    return res.status(200).json({ success: false, error: "Email không đúng định dạng" });
                }
            }
            //Nhóm người dùng
            if(formData.accessId == null || formData.accessId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nhóm người dùng" });
            }
            /**Kiểm tra tồn tại */
            const exist = await User.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Người dùng không tồn tại" });
            }
            //Xử lý
            //Xử lý upload file
            if(req.file){
                var fileName = Date.now().toString() + '-' + req.file.originalname;
                var path = firebaseDB.bucket.file('users/' + formData.username + '/' + fileName);
                var buffer = req.file.buffer;
                var image = await uploadFile(path, buffer);
                var fileURL = await getFileUpload(path);
                formData.img = fileURL[0];
            }
            await User.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        name: formData.name, 
                        physicalId: formData.physicalId,
                        dateOfIssue: formData.dateOfIssue ? formData.dateOfIssue : null,
                        placeOfIssue: formData.placeOfIssue ? formData.placeOfIssue : '',
                        email: formData.email ? formData.email : '',
                        phone: formData.phone,
                        birthday: formData.birthday ? formData.birthday : null,
                        gender: formData.gender ? formData.gender : '',
                        "address.building": formData.address.building ? formData.address.building : '',
                        "address.wardId": formData.address.wardId ? parseInt(formData.address.wardId, 10) : null,
                        "address.districtId": formData.address.districtId ? parseInt(formData.address.districtId, 10) : null,
                        "address.provinceId": formData.address.provinceId ? parseInt(formData.address.provinceId, 10) : null,
                        img: formData.img ? formData.img : '',
                        imageFile: null,
                        accessId: formData.accessId,
                        // position: formData.position ? formData.position : '',
                        isDentist: formData.isDentist,
                        isActive: formData.isActive ? formData.isActive : true,
                        updatedAt: Date.now(),
                        updatedBy: req.username ? req.username : ''
                    }
                }
            );
            var data = await User.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;

            var data = await User.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { username: { $regex: filters.usernameF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await User.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { username: { $regex: filters.usernameF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getDentist: async(req, res) => {
        try{
            var data = await User.find({ isActive: true, isDentist: true });
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getDentistByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;
            var data = await User.find({
                $and: [
                    {
                        $or: [
                            { name: { $regex: filters.textSearch, $options:"i" } },
                            { code: { $regex: filters.textSearch, $options:"i" } },
                        ]
                    },
                    { isDentist: true },
                    { isActive: true }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);
            var total = await User.find({
                $and: [
                    {
                        $or: [
                            { name: { $regex: filters.textSearch, $options:"i" } },
                            { code: { $regex: filters.textSearch, $options:"i" } },
                        ]
                    },
                    { isDentist: true },
                    { isActive: true }
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getNotifyByQuery: async(req, res) => {
        try{
            var user = await jwt.verify(req.token, 'secretKey');
            if(user != null && user.data != null){
                var size = req.body.size;
                var from = req.body.from;
    
                var data = await Notification.find({ userId: mongoose.Types.ObjectId(user.data._id) }).sort({ "createdAt": -1 }).limit(size).skip(from);
    
                return res.status(200).json({ success: true, data: data });
            }
            else{
                return res.status(200).json({ success: true, data: [] });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updateSeenStatus: async(req, res) => {
        try{
            var user = await jwt.verify(req.token, 'secretKey');
            if(user != null && user.data != null){
                var data = await Notification.UpdateSeenStatus(req.body.id, user.data.username);
                return res.status(200).json({ success: true, data: data ? data.data : {} });
            }
            else{
                return res.status(200).json({ success: true, data: {} });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updateSeenStatusAll: async(req, res) => {
        try{
            var user = await jwt.verify(req.token, 'secretKey');
            if(user != null && user.data != null){
                var data = await Notification.UpdateSeenStatusAll(user.data);
                return res.status(200).json({ success: true, data: data ? data.data : {} });
            }
            else{
                return res.status(200).json({ success: true, data: {} });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
}

module.exports = UserController;