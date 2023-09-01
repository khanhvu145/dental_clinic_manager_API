const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const SMTPConfig = require('../models/tw_SMTPConfig');

const SMTPConfigController = {
    createUpdate: async(req, res, next) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên phòng khám" });
            }
            if(formData.email == null || formData.email == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập email" });
            }
            if(formData.password == null || formData.password == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập mật khẩu" });
            }
            if(formData.host == null || formData.host == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập máy chủ" });
            }

            //Xử lý
            //Xóa smtp cũ
            await SMTPConfig.deleteMany({});
            //Tạo cấu hình smtp mới
            const newData = await new SMTPConfig({
                name: formData.name, 
                password: formData.password,
                email: formData.email,
                host: formData.host,
                isActive: formData.isActive,
                createdAt: Date.now(),
                createdBy: req.username ? req.username : ''
            });

            const data = await newData.save();

            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getData: async (req, res) => {
        try{
            var data = await SMTPConfig.find({});
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = SMTPConfigController;