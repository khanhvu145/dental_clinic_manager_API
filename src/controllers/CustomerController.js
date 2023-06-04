const Customer = require('../models/tw_Customer');
const Examination = require('../models/tw_Examination');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const firebaseDB = require('../helpers/firebase');
const uploadFile = require('../helpers/uploadFile');
const getFileUpload = require('../helpers/getFileUpload');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');

const CustomerController = {
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

            //Xử lý
            var exists = await Customer.findOne({ physicalId: formData.physicalId });
            if(exists == null) {
                //Xử lý upload file
                if(req.file){
                    var fileName = Date.now().toString() + '-' + req.file.originalname;
                    var path = firebaseDB.bucket.file('customers/' + formData.physicalId + '/' + fileName);
                    var buffer = req.file.buffer;
                    var image = await uploadFile(path, buffer);
                    var fileURL = await getFileUpload(path);
                    formData.img = fileURL[0];
                }
                //Lưu dữ liệu
                const newData = await new Customer({
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
                    isActive: formData.isActive ? formData.isActive : true,
                    customerGroup: formData.customerGroup ? formData.customerGroup : '',
                    source: formData.source ? formData.source : '',
                    createdAt: Date.now(),
                    createdBy: formData.createdBy ? formData.createdBy : ''
                }).save();
                await Customer.updateOne(
                    { _id: newData._id }, 
                    {
                        $set: { 
                            code: 'CUS-' + newData._id.toString().slice(-5).toUpperCase()
                        }
                    }
                );
                var data = await Customer.findById(newData._id);
                return res.status(200).json({ success: true, message: 'Tạo thành công', data: data });
            }
            else{
                return res.status(200).json({ success: false, error: 'Khách hàng đã tồn tại' });
            }
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

            var data = await Customer.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { phone: { $regex: filters.phoneF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await Customer.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    { name: { $regex: filters.nameF, $options:"i" } },
                    { phone: { $regex: filters.phoneF, $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getById: async(req, res) => {
        try{
            const data = await Customer.findById(req.params.id);
            return res.status(200).json({ success: true, data: data });
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
            /**Kiểm tra tồn tại */
            const exist = await Customer.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Khách hàng không tồn tại" });
            }
            //Xử lý
            //Xử lý upload file
            if(req.file){
                var fileName = Date.now().toString() + '-' + req.file.originalname;
                var path = firebaseDB.bucket.file('customers/' + formData.physicalId + '/' + fileName);
                var buffer = req.file.buffer;
                var image = await uploadFile(path, buffer);
                var fileURL = await getFileUpload(path);
                formData.img = fileURL[0];
            }
            await Customer.updateOne(
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
                        isActive: formData.isActive ? formData.isActive : true,
                        customerGroup: formData.customerGroup ? formData.customerGroup : '',
                        source: formData.source ? formData.source : '',
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );
            var data = await Customer.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getAll: async(req, res) => {
        try{
            var data = await Customer.find({ isActive: true });
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    createExamination: async(req, res) => {
        try{
            var formData = req.body;
            var fileList = req.files;
            
            //#region Kiểm tra đầu vào
            //Kiểm tra KH
            const customer = await Customer.findById(formData.customerId);
            if(customer == null) {
                return res.status(200).json({ success: false, error: "Khách hàng không tồn tại" });
            }
            //Kiểm tra file chỉ định
            if(formData.attachFiles != null && formData.attachFiles.length > 0){
                for(let i = 0; i < formData.attachFiles.length; i++){
                    if(IsNullOrEmpty(formData.attachFiles[i].type)) {
                        return res.status(200).json({ success: false, error: "Vui lòng chọn loại chỉ định" });
                    }
                    if(formData.attachFiles[i].fileList == null || formData.attachFiles[i].fileList.length == 0){
                        return res.status(200).json({ success: false, error: "Vui lòng nhập file chỉ định" });
                    }
                }
            }
            //Kiểm tra chẩn đoán và điều trị
            if(formData.diagnosisTreatment == null || formData.diagnosisTreatment.length == 0){
                return res.status(200).json({ success: false, error: "Vui lòng nhập chẩn đoán & điều trị" });
            }
            //#endregion

            //#region Upload files
            if(formData.attachFiles != null && formData.attachFiles.length > 0){
                var dem = 0;
                var lengthArr = formData.attachFiles[dem].fileList.length;
                formData.attachFiles[dem].files = [];
                if(fileList != null && fileList.length > 0){
                    for(let i = 0; i < fileList.length; i++){
                        var file = fileList[i];
                        if(file){
                            if(i == lengthArr){
                                dem += 1;
                                lengthArr = formData.attachFiles[dem].fileList.length;
                                formData.attachFiles[dem].files = [];
                            }
                            var fileName = Date.now().toString() + '-' + file.originalname;
                            var path = firebaseDB.bucket.file('examination/' + formData.customerId + '/' + fileName);
                            var buffer = file.buffer;
                            var image = await uploadFile(path, buffer);
                            var fileURL = await getFileUpload(path);
                            await formData.attachFiles[dem].files.push(fileURL[0]);
                        }
                    }
                }
                formData.attachFiles = formData.attachFiles.map(x => {
                    return {
                      ...x,
                      fileList: null
                    }
                });
            }
            //#endregion

            //#region Tạo phiếu khám
            if(formData.anamnesis != null && formData.anamnesis.length > 0){
                formData.anamnesis = formData.anamnesis.map(x => {
                    return {
                      ...x,
                      isCheck: x.isCheck == 'true' ? true : false
                    }
                });
            }
            const newData = await new Examination({
                customerId: formData.customerId, 
                anamnesis: formData.anamnesis || [], 
                "allergy.allergies": formData.allergy.allergies || [],
                "allergy.other": formData.allergy.other || '',
                clinicalExam: formData.clinicalExam || '', 
                "preclinicalExam.xquang": formData.preclinicalExam.xquang || [],
                "preclinicalExam.test": formData.preclinicalExam.test || [],
                "preclinicalExam.other": formData.preclinicalExam.other || '',
                attachFiles: formData.attachFiles || [], 
                diagnosisTreatment: formData.diagnosisTreatment || [], 
                treatmentAmount: formData.treatmentAmount ? parseFloat(formData.treatmentAmount) : parseFloat(0),
                totalDiscountAmount: formData.totalDiscountAmount ? parseFloat(formData.totalDiscountAmount) : parseFloat(0),
                totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : parseFloat(0),
                createdAt: Date.now(),
                createdBy: formData.createdBy ? formData.createdBy : ''
            }).save();

            await Examination.updateOne(
                { _id: newData._id }, 
                {
                    $set: { 
                        code: 'EXAM-' + newData._id.toString().slice(-5).toUpperCase()
                    }
                }
            );
            var data = await Examination.findById(newData._id);
            //#endregion

            return res.status(200).json({ success: true, message: 'Tạo phiếu khám thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getLatestExamination: async(req, res) => {
        try{
            const data = await Examination.find({ customerId: req.body.customerId }).sort({createdAt:-1}).limit(1);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
}

module.exports = CustomerController;