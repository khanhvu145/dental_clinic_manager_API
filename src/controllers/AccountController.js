const User = require('../models/tw_User');
const AccessGroup = require('../models/tw_AccessGroup');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const crypto = require('crypto');
const sendMail = require('../helpers/sendMail');
const path = require('path');
const fs = require('fs');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const convertDateToCron = require('../helpers/convertDateToCron');
const CronJob = require('cron').CronJob;
const moment = require('moment');

const AccountController = {
    login: async(req, res) => {
        try {
            //Kiểm tra đầu vào
            if(req.body.username == '' || req.body.password == ''){
                return res.status(200).json({ success: false, error: 'Hãy điền đầy đủ thông tin'});
            }

            const user = await User.findOne({ username: req.body.username });
            if(user == null) {
                return res.status(200).json({ success: false, error: 'Tài khoản hoặc mật khẩu không đúng', data: '' });
            }
            //Kiểm tra trạng thái hoạt động của tài khoản
            if(!user.isActive){
                return res.status(200).json({ success: false, error: 'Tài khoản đã ngưng hoạt động', data: '' });
            }

            var data = {
                _id: user._id,
                username: user.username,
                name: user.name, 
                phone: user.phone,
                img: user.img,
            };
            var token = jwt.sign({data}, 'secretKey');

            if(user && bcrypt.compareSync(req.body.password, user.password)){
                return res.status(200).json({ success: true, message: 'Đăng nhập thành công', data: { token: token } });
            }
            else{
                return res.status(200).json({ success: false, error: 'Tài khoản hoặc mật khẩu không đúng', data: '' });
            }
        }catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    info: async (req, res) => {
        try{
            var data = await jwt.verify(req.token, 'secretKey');
            const user = await User.findById(data.data._id);
            if(user != null){
                const accessesGroup = await AccessGroup.findById(user.accessId);
                var accesses = accessesGroup.accesses;
                data.data.accesses = (accesses.length > 0) ? accesses : [];
                return res.status(200).json({ success: true, data: data });
            }
            else{
                return res.status(400).json({success: false, error: 'Không có thông tin người dùng'});
            }
        }catch(err){
            return res.status(400).json({success: false, error: err});
        }
    },
    resetPassword: async(req, res) => {
        try{
            var formData = req.body;
            var dataToken = await jwt.verify(req.token, 'secretKey');
            /** Kiểm tra điều kiện đầu vào */
            //Mật khẩu hiện tại
            if(formData.currentPassword == null || formData.currentPassword == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mật khẩu hiện tại" });
            }
            //Mật khẩu mới
            if(formData.newPassword == null || formData.newPassword == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mật khẩu mới" });
            }
            //Xác nhận mật khẩu
            if(formData.confirmPassword == null || formData.confirmPassword == '') {
                return res.status(200).json({ success: false, error: "Hãy xác nhận mật khẩu" });
            }

            /**Xử lý */
            const user = await User.findById(dataToken.data._id);
            if(user == null) {
                return res.status(200).json({ success: false, error: 'Tài khoản không tồn tại' });
            }
            /**Kiểm tra mật khẩu hiện tại có chính xác */
            if(bcrypt.compareSync(formData.currentPassword, user.password) == false) {
                return res.status(200).json({ success: false, error: 'Mật khẩu hiện tại không chính xác' });
            }

            /**Kiểm tra mật khẩu mới và mật khẩu xác nhận có khớp */
            if(formData.newPassword.trim() != formData.confirmPassword.trim()){
                return res.status(200).json({ success: false, error: 'Xác nhận mật khẩu không khớp' });
            }

            await User.updateOne(
                { _id: formData.id }, 
                {
                    $set: { 
                        password: bcrypt.hashSync(formData.newPassword.trim(), salt)
                    }
                }
            );

            return res.status(200).json({ success: true, message: 'Cập nhật mật khẩu thành công. Hãy đăng nhập lại' });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    forgotPassword: async(req, res) => {
        try{
            var formData = req.body;
            if(formData.username == null || formData.username == ''){
                return res.status(200).json({ success: false, error: 'Hãy nhập thông tin tài khoản' });
            }
            // Lấy thông tin người dùng
            const user = await User.findOne({ username: formData.username });
            if(user == null){
                return res.status(200).json({ success: false, error: 'Tài khoản không tồn tại' });
            }

            var stringRandom = crypto.randomBytes(16).toString('hex');
            var newPass = bcrypt.hashSync(stringRandom.trim(), salt);
            await User.updateOne(
                { _id: user._id }, 
                {
                    $set: { 
                        password: newPass,
                        updatedAt: Date.now(),
                        updatedBy: 'System - update pass'
                    }
                }
            ).then(async() => {
                try{
                    if(!IsNullOrEmpty(user.email)){
                        var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/ForgotPassWordTemplate.html'),{encoding:'utf-8'});
                        if(template){
                            template = template.replace(/{name}/g, user.name ? user.name : '');
                            template = template.replace(/{username}/g, user.username ? user.username : '');
                            template = template.replace(/{password}/g, stringRandom ? stringRandom : '');
                            var timeRemind = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
                            var expireTime = moment(timeRemind).add(10, 's')._d;
                            var dateCronRemind = convertDateToCron(expireTime);
            
                            var job = await new CronJob(
                                dateCronRemind,
                                async function(){
                                    await sendMail({ to: user.email, subject: 'LẤY LẠI MẬT KHẨU THÀNH CÔNG', body: template });
                                },
                                null,
                                true,
                                'Asia/Ho_Chi_Minh'
                            );
                            await job.start();
                        }
                    }
                    return res.status(200).json({ success: true });
                }
                catch (e){
                    return res.status(200).json({ success: false, error: "Có lỗi xảy ra: " + e });
                }
            })
            .catch(() => {
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }); 
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = AccountController;