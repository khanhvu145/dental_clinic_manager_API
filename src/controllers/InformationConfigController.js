const InformationConfig = require('../models/tw_InformationConfig');
const firebaseDB = require('../helpers/firebase');
const uploadFile = require('../helpers/uploadFile');
const getFileUpload = require('../helpers/getFileUpload');

const InformationConfigController = {
    createUpdate: async(req, res, next) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.name == null || formData.name == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập tên phòng khám" });
            }
            if(formData.phone != null && formData.phone != ''){
                var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
                var phone = formData.phone;
                if(!vnf_regex.test(phone)){
                    return res.status(200).json({ success: false, error: "Số điện thoại không đúng định dạng" });
                }
            }
            if(formData.email != null && formData.email != '') {
                var email = formData.email; 
                var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/; 
                if (!filter.test(email)) { 
                    return res.status(200).json({ success: false, error: "Email không đúng định dạng" });
                }
            }

            //Xử lý
            //Xóa data cũ
            await InformationConfig.deleteMany({});
            //Upload ảnh
            if(req.file){
                var fileName = Date.now().toString() + '-' + req.file.originalname;
                var path = firebaseDB.bucket.file('informationConfig/' + fileName);
                var buffer = req.file.buffer;
                var image = await uploadFile(path, buffer);
                var fileURL = await getFileUpload(path);
                formData.img = fileURL[0];
            }
            //Tạo cấu hình smtp mới
            const newData = await new InformationConfig({
                name: formData.name, 
                address: formData.address, 
                phone: formData.phone, 
                email: formData.email, 
                website: formData.website, 
                img: formData.img ? formData.img : '',
                imageFile: null,
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
            var data = await InformationConfig.find({});
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = InformationConfigController;