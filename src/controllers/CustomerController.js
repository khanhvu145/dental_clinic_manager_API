const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const Receipts = require('../models/tw_Receipts');
const Designation = require('../models/tw_Examination_Designation');
const Prescription = require('../models/tw_Examination_Prescription');
const User = require('../models/tw_User');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const firebaseDB = require('../helpers/firebase');
const uploadFile = require('../helpers/uploadFile');
const getFileUpload = require('../helpers/getFileUpload');
const deleteFileUpload = require('../helpers/deleteFileUpload');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const mongoose = require('mongoose');
const { file } = require('googleapis/build/src/apis/file');

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
                    createdBy: formData.createdBy ? formData.createdBy : '',
                    fullAddress: formData.fullAddress ? formData.fullAddress : ''
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

                //#region Log
                var log = [];
                var isUpdate = false;
                if(!IsNullOrEmpty(data.name)) {
                    isUpdate = true;
                    var item = {
                        column: 'Họ và tên',
                        oldvalue: '',
                        newvalue: data.name
                    };
                    log.push(item);
                }
                if(!IsNullOrEmpty(data.physicalId)) {
                    isUpdate = true;
                    var item = {
                        column: 'CMND/CCCD',
                        oldvalue: '',
                        newvalue: data.physicalId
                    };
                    log.push(item);
                }
                if(data.dateOfIssue != null) {
                    isUpdate = true;
                    var item = {
                        column: 'Ngày cấp',
                        oldvalue: '',
                        newvalue: moment(data.dateOfIssue).format('DD/MM/YYYY')
                    };
                    log.push(item);
                }
                if(!IsNullOrEmpty(data.placeOfIssue)) {
                    isUpdate = true;
                    var item = {
                        column: 'Nơi cấp',
                        oldvalue: '',
                        newvalue: data.placeOfIssue
                    };
                    log.push(item);
                }
                if(!IsNullOrEmpty(data.phone)) {
                    isUpdate = true;
                    var item = {
                        column: 'Số điện thoại',
                        oldvalue: '',
                        newvalue: data.phone
                    };
                    log.push(item);
                }
                if(!IsNullOrEmpty(data.email)) {
                    isUpdate = true;
                    var item = {
                        column: 'Email',
                        oldvalue: '',
                        newvalue: data.email
                    };
                    log.push(item);
                }
                if(data.birthday != null) {
                    isUpdate = true;
                    var item = {
                        column: 'Ngày sinh',
                        oldvalue: '',
                        newvalue: moment(data.birthday).format('DD/MM/YYYY')
                    };
                    log.push(item);
                }
                if(!IsNullOrEmpty(data.gender)) {
                    isUpdate = true;
                    var item = {
                        column: 'Giới tính',
                        oldvalue: '',
                        newvalue: data.gender == 'male' ? 'Nam' : data.gender == 'female' ? 'Nữ' : 'Khác'
                    };
                    log.push(item);
                }
                if(!IsNullOrEmpty(data.fullAddress)) {
                    isUpdate = true;
                    var item = {
                        column: 'Địa chỉ',
                        oldvalue: '',
                        newvalue: formData.fullAddress
                    };
                    log.push(item);
                }
                if (isUpdate)
                {
                    await CustomerLog.CreateLog(data._id, 'profile', log, 'create', formData.createdBy);
                }
                //#endregion
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
                    { code: { $regex: filters.codeF.trim(), $options:"i" } },
                    { name: { $regex: filters.nameF.trim(), $options:"i" } },
                    { phone: { $regex: filters.phoneF.trim(), $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await Customer.find({
                $and: [
                    { code: { $regex: filters.codeF.trim(), $options:"i" } },
                    { name: { $regex: filters.nameF.trim(), $options:"i" } },
                    { phone: { $regex: filters.phoneF.trim(), $options:"i" } },
                    { isActive: { $in: filters.statusF == null ? [true, false] : [filters.statusF] } }
                ]
            }).count();

            if(data && data.length > 0){
                for(var i = 0; i < data.length; i++){
                    var log = await CustomerLog.find({ customerId: mongoose.Types.ObjectId(data[i]._id) }).sort({ "createdAt": -1 }).limit(1);
                    if(log && log.length > 0){
                        data[i].recentActivity = log[0].createdAt;
                    }
                }
            }
            
            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByTextSearch: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;

            var data = await Customer.find({
                $and: [
                    {
                        $or: [
                            { name: { $regex: filters.textSearch, $options:"i" } },
                            { phone: { $regex: filters.textSearch, $options:"i" } },
                            { code: { $regex: filters.textSearch, $options:"i" } },
                        ]
                    },
                    { isActive: true },
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await Customer.find({
                $and: [
                    {
                        $or: [
                            { name: { $regex: filters.textSearch, $options:"i" } },
                            { phone: { $regex: filters.textSearch, $options:"i" } },
                            { code: { $regex: filters.textSearch, $options:"i" } },
                        ]
                    },
                    { isActive: true },
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
            else{
                //Kiểm tra trùng CMND/CCCD
                var existsCustomer = await Customer.findOne({ physicalId: formData.physicalId });
                if(existsCustomer != null){
                    return res.status(200).json({ success: false, error: "Khách hàng trùng CMND/CCCD" });
                }
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
                        updatedBy: formData.updatedBy ? formData.updatedBy : '',
                        fullAddress: formData.fullAddress ? formData.fullAddress : ''
                    }
                }
            );
            var data = await Customer.findById(formData._id);

            //#region Log
            var log = [];
            var isUpdate = false;
            if(exist.name != data.name) {
                isUpdate = true;
                var item = {
                    column: 'Họ và tên',
                    oldvalue: exist.name,
                    newvalue: data.name
                };
                log.push(item);
            }
            if(exist.physicalId != data.physicalId) {
                isUpdate = true;
                var item = {
                    column: 'CMND/CCCD',
                    oldvalue: exist.physicalId,
                    newvalue: data.physicalId
                };
                log.push(item);
            }
            if(moment(exist.dateOfIssue).format('DD/MM/YYYY') != moment(data.dateOfIssue).format('DD/MM/YYYY')) {
                isUpdate = true;
                var item = {
                    column: 'Ngày cấp',
                    oldvalue: moment(exist.dateOfIssue).format('DD/MM/YYYY'),
                    newvalue: moment(data.dateOfIssue).format('DD/MM/YYYY')
                };
                log.push(item);
            }
            if(exist.placeOfIssue != data.placeOfIssue) {
                isUpdate = true;
                var item = {
                    column: 'Nơi cấp',
                    oldvalue: exist.placeOfIssue,
                    newvalue: data.placeOfIssue
                };
                log.push(item);
            }
            if(exist.phone != data.phone) {
                isUpdate = true;
                var item = {
                    column: 'Số điện thoại',
                    oldvalue: exist.phone,
                    newvalue: data.phone
                };
                log.push(item);
            }
            if(exist.email != data.email) {
                isUpdate = true;
                var item = {
                    column: 'Email',
                    oldvalue: exist.email,
                    newvalue: data.email
                };
                log.push(item);
            }
            if(moment(exist.birthday).format('DD/MM/YYYY') != moment(data.birthday).format('DD/MM/YYYY')) {
                isUpdate = true;
                var item = {
                    column: 'Ngày sinh',
                    oldvalue: moment(exist.birthday).format('DD/MM/YYYY'),
                    newvalue: moment(data.birthday).format('DD/MM/YYYY')
                };
                log.push(item);
            }
            if(exist.gender != data.gender) {
                isUpdate = true;
                var item = {
                    column: 'Giới tính',
                    oldvalue: exist.gender == 'male' ? 'Nam' : exist.gender == 'female' ? 'Nữ' : 'Khác',
                    newvalue: data.gender == 'male' ? 'Nam' : data.gender == 'female' ? 'Nữ' : 'Khác'
                };
                log.push(item);
            }
            if(exist.fullAddress != data.fullAddress) {
                isUpdate = true;
                var item = {
                    column: 'Địa chỉ',
                    oldvalue: exist.fullAddress,
                    newvalue: formData.fullAddress
                };
                log.push(item);
            }
            if (isUpdate)
            {
                await CustomerLog.CreateLog(data._id, 'profile', log, 'update', formData.updatedBy);
            }
            //#endregion

            return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    createExamination: async(req, res) => {
        try{
            var formData = req.body;
            var anamnesis = [];
            var allergy = {
                allergies: [],
                other: ''
            }
            //Lấy thông tin người dùng hiện tại
            const user = await User.findOne({ username: req.username });
            if(user == null){
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }
            //#region Kiểm tra đầu vào
            //Kiểm tra KH
            const customer = await Customer.findById(formData.customerId);
            if(customer == null) {
                return res.status(200).json({ success: false, error: "Khách hàng không tồn tại" });
            }
            //#endregion

            //#region Lấy thông tin phiếu khám gần nhất (nếu có)
            const lastExamination = await Examination.find({ customerId: customer._id, status: 'completed' }).sort({createdAt:-1}).limit(1);
            if(lastExamination && lastExamination.length > 0){
                anamnesis = lastExamination[0].anamnesis;
                allergy.allergies = lastExamination[0].allergy.allergies || [];
                allergy.other = lastExamination[0].allergy.other || '';
            }
            //#endregion

            //#region Tạo phiếu khám
            const newData = await new Examination({
                customerId: customer._id, 
                dentistId: user._id, 
                anamnesis: anamnesis || [], 
                "allergy.allergies": allergy.allergies || [],
                "allergy.other": allergy.other || '',
                clinicalExam: '', 
                "preclinicalExam.xquang": [],
                "preclinicalExam.test": [],
                "preclinicalExam.other": '',
                diagnosisTreatment: [], 
                treatmentAmount: parseFloat(0),
                totalDiscountAmount: parseFloat(0),
                totalAmount: parseFloat(0),
                note: '', 
                status: 'new',
                createdAt: Date.now(),
                createdBy: req.username ? req.username : ''
            }).save();

            await Examination.updateOne(
                { _id: newData._id }, 
                {
                    $set: { 
                        code: 'EXAM' + newData._id.toString().slice(-5).toUpperCase()
                    }
                }
            );
            var data = await Examination.findById(newData._id);
            //#endregion

            //#region Log
            var log = [];
            var isUpdate = false;
            if(data != null) {
                isUpdate = true;
                var item = {
                    column: 'Khám và điều trị',
                    oldvalue: {},
                    newvalue: data
                };
                log.push(item);
            }
            if (isUpdate)
            {
                await CustomerLog.CreateLog(data.customerId, 'examination', log, 'create', req.username);
            }
            //#endregion

            return res.status(200).json({ success: true, message: 'Tạo phiếu khám thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updateExamination: async(req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra đầu vào
            //Kiểm tra tồn tại
            const exist = await Examination.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            else{
                if(exist.status != 'new'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu khám không hợp lệ" });
                }
            }
            //Kiểm tra KH
            const customer = await Customer.findById(formData.customerId);
            if(customer == null) {
                return res.status(200).json({ success: false, error: "Khách hàng không tồn tại" });
            }
            //#endregion

            //#region Cập nhật phiếu khám
            await Examination.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        anamnesis: formData.anamnesis || [], 
                        "allergy.allergies": formData.allergy.allergies || [],
                        "allergy.other": formData.allergy.other || '',
                        clinicalExam: formData.clinicalExam || '', 
                        "preclinicalExam.xquang": formData.preclinicalExam.xquang || [],
                        "preclinicalExam.test": formData.preclinicalExam.test || [],
                        "preclinicalExam.other": formData.preclinicalExam.other || '',
                        diagnosisTreatment: formData.diagnosisTreatment || [], 
                        treatmentAmount: formData.treatmentAmount ? parseFloat(formData.treatmentAmount) : parseFloat(0),
                        totalDiscountAmount: formData.totalDiscountAmount ? parseFloat(formData.totalDiscountAmount) : parseFloat(0),
                        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : parseFloat(0),
                        note: formData.note, 
                        updatedAt: Date.now(),
                        updatedBy: req.username ? req.username : ''
                    }
                }
            );
            var data = await Examination.findById(formData._id);
            //#endregion

            //#region Log
            // var log = [];
            // var isUpdate = false;
            // if(data != null) {
            //     isUpdate = true;
            //     var item = {
            //         column: 'Khám và điều trị',
            //         oldvalue: exist,
            //         newvalue: data
            //     };
            //     log.push(item);
            // }
            // if (isUpdate)
            // {
            //     await CustomerLog.CreateLog(data.customerId, 'examination', log, 'update', formData.updatedBy);
            // }
            //#endregion

            return res.status(200).json({ success: true, message: 'Cập nhật phiếu khám thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getLatestExamination: async(req, res) => {
        try{
            const data = await Examination.find({ customerId: req.body.customerId, status: 'approved' }).sort({createdAt:-1}).limit(1);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQueryExamination: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = req.body.sorts;
            var pages = req.body.pages;
            var listDentistId = filters.dentistsF.map(x => mongoose.Types.ObjectId(x));
            var dateFromF = null;
            var dateToF = null;
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(new Date(moment(filters.dateF[0]).format('YYYY/MM/DD')).setHours(0,0,0,0));
                dateToF = new Date(new Date(moment(filters.dateF[1]).format('YYYY/MM/DD')).setHours(23,59,0,0));
            }
            
            var data = await Examination.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                    }
                },
                { $project: { 
                    dentistInfo: 0,
                    customerInfo: 0
                }},
                { $match: { 
                    $and: [
                        { customerId: mongoose.Types.ObjectId(filters.customerF) },
                        { code: { $regex: filters.codeF, $options:"i" } },
                        dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                        dateToF ? { createdAt: { $lte: dateToF } } : {},
                        (filters.dentistsF.length > 0 && filters.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {},
                        (filters.statusF.length > 0 && filters.statusF != null) ? { 
                            status: { $in: filters.statusF }
                        } : {}
                    ]
                }},
                { $sort: { createdAt: sorts }},
                { $limit: (pages.from + pages.size) },
                { $skip: pages.from }
            ]);
            
            var total = await Examination.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { 
                    $and: [
                        { customerId: mongoose.Types.ObjectId(filters.customerF) },
                        { code: { $regex: filters.codeF, $options:"i" } },
                        dateFromF ? { date: { $gte: dateFromF } } : {},
                        dateToF ? { date: { $lte: dateToF } } : {},
                        (filters.dentistsF.length > 0 && filters.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {}
                    ]
                }},
                { $count: "count" }
            ]);
            
            return res.status(200).json({ success: true, data: data, total: total.length > 0 ? total[0].count : 0 });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQueryDiary: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;
            var dateFromF = null;
            var dateToF = null;
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(moment(filters.dateF[0]).format('YYYY/MM/DD'));
                dateToF = new Date(moment(filters.dateF[1]).format('YYYY/MM/DD'));
            }
            
            var data = await CustomerLog.find({
                $and: [
                    { customerId: mongoose.Types.ObjectId(filters.customerF) },
                    dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                    dateToF ? { createdAt: { $lte: dateToF } } : {},
                    (filters.typeF && filters.typeF != 'all') ? { type: filters.typeF } : {}
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);

            var total = await CustomerLog.find({
                $and: [
                    { customerId: mongoose.Types.ObjectId(filters.customerF) },
                    dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                    dateToF ? { createdAt: { $lte: dateToF } } : {},
                    (filters.typeF && filters.typeF != 'all') ? { type: filters.typeF } : {}
                ]
            }).count();

            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getExaminationById: async(req, res) => {
        try{
            var data = await Examination.aggregate([
                { $lookup: {
                    from: "tw_examination_designations",
                    localField: "_id",
                    foreignField: "examinationId",
                    pipeline: [
                        { $match: { deleted: false } },
                    ],
                    as: "attachFiles"
                }},
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                    }
                },
                { $project: { 
                    dentistInfo: 0,
                    customerInfo: 0
                }},
                { $match: { 
                    $and: [
                        { _id: mongoose.Types.ObjectId(req.params.id) },
                    ]
                }}
            ]);

            return res.status(200).json({ success: true, data: data && data.length > 0 ? data[0] : new Examination() });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    removeDesignation: async (req, res) => {
        try{
            // Kiểm tra tồn tại
            var exist = await Designation.findById(req.params.id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin chỉ định" });
            }
            const examination = await Examination.findById(exist.examinationId);
            if(examination == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            else{
                if(examination.status != 'new'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu khám không hợp lệ" });
                }
            }
            //Xử lý hủy chỉ định
            Designation.delete({ _id: mongoose.Types.ObjectId(exist._id)})
                .then(async() => {
                    try{
                        //Xóa file trên firebase
                        if(exist.files && exist.files.length > 0){
                            for(let i = 0; i < exist.files.length; i++){
                                var file = exist.files[i];
                                var result = await deleteFileUpload('designation/' + examination.customerId + '/' + exist.examinationId + '/' + file.name);
                            }
                        }
                        return res.status(200).json({ success: true });
                    }
                    catch (e){
                        return res.status(200).json({ success: false, error: e });
                    }
                })
                .catch(() => {
                    return res.status(200).json({ success: false, error: "Xóa chỉ định không thành công" });
                }); 
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    uploadDesignation: async (req, res) => {
        try{
            var formData = req.body;
            var fileList = req.files;
            var data = new Designation();
            var fileArr = [];
            //#region Kiểm tra đầu vào
            //Kiểm tra phiếu khám
            const examination = await Examination.findById(formData.examinationId);
            if(examination == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            else{
                if(examination.status != 'new'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu khám không hợp lệ" });
                }
            }
            //Kiểm tra loại chỉ định
            if(IsNullOrEmpty(formData.type)){
                return res.status(200).json({ success: false, error: "Hãy chọn loại chỉ định" });
            }
            //#endregion

            //#region Xử lý file
            if(fileList != null && fileList.length > 0){
                for(let i = 0; i < fileList.length; i++){
                    var file = fileList[i];
                    var fileName = Date.now().toString() + '_' + file.originalname;
                    var path = firebaseDB.bucket.file('designation/' + examination.customerId + '/' + formData.examinationId + '/' + fileName);
                    var buffer = file.buffer;
                    var image = await uploadFile(path, buffer);
                    var fileURL = await getFileUpload(path);
                    await fileArr.push({
                        name: fileName,
                        url: fileURL[0]
                    });        
                }
            }
            //#endregion

            //#region Xử lý
            if(formData._id){ //Cập nhật chỉ định
                var exists = await Designation.findById(formData._id);
                if(exists == null){
                    return res.status(200).json({ success: false, error: "Không có thông tin chỉ định" });
                }
                if(fileArr && fileArr.length > 0){
                    await formData.files.push(...fileArr);
                }
                await Designation.updateOne(
                    { _id: formData._id }, 
                    {
                        $set: { 
                            type: formData.type,
                            description: formData.description,
                            files: formData.files,
                            updatedAt: Date.now(),
                            updatedBy: req.username ? req.username : ''
                        }
                    }
                );
                data = await Examination.findById(formData._id);
            }
            else{ //Thêm mới chỉ định
                const newData = await new Designation({
                    examinationId: formData.examinationId,
                    type: formData.type,
                    description: formData.description,
                    fileList: [],
                    files: fileArr || [],
                    createdAt: Date.now(),
                    createdBy: req.username ? req.username : ''
                }).save();
                data = newData;
            }
            //#endregion
            return res.status(200).json({ success: true, message: 'Lưu chỉ định thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    removeDesignationFile: async (req, res) => {
        try{
            var formData = req.body;
            // Kiểm tra tồn tại
            var exist = await Designation.findById(formData.id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin chỉ định" });
            }
            const examination = await Examination.findById(exist.examinationId);
            if(examination == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            else{
                if(examination.status != 'new'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu khám không hợp lệ" });
                }
            }

            //Xử lý xóa file
            var newFiles = exist.files.filter(e => e.name != formData.file.name);
            await Designation.updateOne(
                { _id: formData.id }, 
                {
                    $set: { 
                        files: newFiles,
                        updatedAt: Date.now(),
                        updatedBy: req.username ? req.username : ''
                    }
                }
            ).then(async() => {
                try{
                    //Xóa file trên firebase
                    if(formData.file){
                        var file = formData.file;
                        var result = await deleteFileUpload('designation/' + examination.customerId + '/' + exist.examinationId + '/' + file.name);
                    }
                    var data = await Designation.findById(formData.id);
                    return res.status(200).json({ success: true, data: data });
                }
                catch (e){
                    return res.status(200).json({ success: false, error: e });
                }
            })
            .catch(() => {
                return res.status(200).json({ success: false, error: "Xóa file không thành công" });
            }); 
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    confirmExamination: async (req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra thông tin
            const exists = await Examination.findById(formData.id);
            if(exists == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            else{
                if(exists.status != 'new'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu khám không hợp lệ" });
                }
                if(exists.diagnosisTreatment == null || exists.diagnosisTreatment.length <= 0){
                    return res.status(200).json({ success: false, error: "Chưa có thông tin khám và điều trị" });
                }
            }
            //#endregion
            //#region Xử lý
            await Examination.updateOne(
                { _id: exists._id }, 
                {
                    $set: { 
                        status: 'confirm',
                        confirmAt: Date.now(),
                        confirmBy: req.username ? req.username : ''
                    }
                }
            ).then(async() => {
                try{
                    var data = await Examination.findById(exists._id);
                    //#region Log
                    var log = [];
                    var isUpdate = false;
                    if(data != null) {
                        isUpdate = true;
                        var item = {
                            column: 'Xác nhận điều trị',
                            oldvalue: {},
                            newvalue: data
                        };
                        log.push(item);
                    }
                    if (isUpdate)
                    {
                        await CustomerLog.CreateLog(data.customerId, 'examination', log, 'confirm', req.username);
                    }
                    //#endregion
                    return res.status(200).json({ success: true, message: 'Xác nhận điều trị thành công', data: data });
                }
                catch (e){
                    return res.status(200).json({ success: false, error: e });
                }
            })
            .catch(() => {
                return res.status(200).json({ success: false, error: "Xác nhận điều trị không thành công" });
            }); 
            //#endregion
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    cancelExamination: async (req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra thông tin
            const exists = await Examination.findById(formData.id);
            if(exists == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            else{
                if(exists.status != 'new' && exists.status != 'confirm'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu khám không hợp lệ" });
                }
            }
            //#endregion
            //#region Xử lý
            await Examination.updateOne(
                { _id: exists._id }, 
                {
                    $set: { 
                        status: 'cancelled',
                        cancelReason: formData.cancelReason || '',
                        cancelledAt: Date.now(),
                        cancelledBy: req.username ? req.username : ''
                    }
                }
            ).then(async() => {
                try{
                    //#region Log
                    var data = await Examination.findById(exists._id);
                    var log = [];
                    var isUpdate = false;
                    if(data != null) {
                        isUpdate = true;
                        var item = {
                            column: 'Hủy phiếu khám',
                            oldvalue: {},
                            newvalue: data
                        };
                        log.push(item);
                    }
                    if (isUpdate)
                    {
                        await CustomerLog.CreateLog(data.customerId, 'examination', log, 'cancel', req.username);
                    }
                    //#endregion

                    return res.status(200).json({ success: true, message: 'Hủy phiếu khám thành công', data: {} });
                }
                catch (e){
                    return res.status(200).json({ success: false, error: e });
                }
            })
            .catch(() => {
                return res.status(200).json({ success: false, error: "Hủy phiếu khám không thành công" });
            }); 
            //#endregion
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    completeExamination: async (req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra thông tin
            const exists = await Examination.findById(formData.id);
            if(exists == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            else{
                if(exists.status != 'confirm'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu khám không hợp lệ" });
                }
                if(exists.diagnosisTreatment == null || exists.diagnosisTreatment.length <= 0){
                    return res.status(200).json({ success: false, error: "Chưa có thông tin khám và điều trị" });
                }
            }
            //#endregion
            //#region Xử lý
            await Examination.updateOne(
                { _id: exists._id }, 
                {
                    $set: { 
                        status: 'completed',
                        completedAt: Date.now(),
                        completedBy: req.username ? req.username : ''
                    }
                }
            ).then(async() => {
                try{
                    var data = await Examination.findById(exists._id);
                    //#region Tạo thanh toán
                    if(data){
                        //Chuẩn hóa dữ liệu
                        const paymentData = {
                            examinationId: exists._id,
                            customerId: exists.customerId,
                            amount: exists.totalAmount,
                            paidAmount: parseFloat(0),
                            remainAmount: exists.totalAmount,
                            status: 'unpaid',
                            createdAt: Date.now(),
                            createdBy: formData.approvedBy
                        };
                        var payment = await Payment.createPayment(paymentData);
                        if(payment.code <= 0){
                            return res.status(200).json({ success: false, error: payment.error });
                        }
                    }
                    //#endregion
                    //#region Log
                    var log = [];
                    var isUpdate = false;
                    if(data != null) {
                        isUpdate = true;
                        var item = {
                            column: 'Hoàn thành điều trị',
                            oldvalue: {},
                            newvalue: data
                        };
                        log.push(item);
                    }
                    if (isUpdate)
                    {
                        await CustomerLog.CreateLog(data.customerId, 'examination', log, 'completed', req.username);
                    }
                    //#endregion
                    return res.status(200).json({ success: true, message: 'Hoàn thành điều trị thành công', data: data });
                }
                catch (e){
                    return res.status(200).json({ success: false, error: e });
                }
            })
            .catch(() => {
                return res.status(200).json({ success: false, error: "Hoàn thành điều trị không thành công" });
            }); 
            //#endregion
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    createPrescription: async (req, res) => {
        try{
            var formData = req.body;
            // Kiểm tra thông tin phiếu khám
            const examination = await Examination.findById(formData.examinationId);
            if(examination == null){
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu khám" });
            }
            // Xử lý
            const newData = await new Prescription({
                examinationId: examination._id, 
                advice: formData.advice || '', 
                medicines: formData.medicines || [],
                createdAt: Date.now(),
                createdBy: formData.createdBy ? formData.createdBy : ''
            }).save();

            return res.status(200).json({ success: true, message: 'Lưu đơn thuốc thành công', data: newData });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updatePrescription: async (req, res) => {
        try{
            var formData = req.body;
            //Kiểm tra tồn tại
            const existed = await Prescription.findById(formData._id);
            if(existed == null){
                return res.status(200).json({ success: false, error: "Không có thông tin đơn thuốc" });
            }
            // Xử lý
            await Prescription.updateOne(
                { _id: existed._id }, 
                {
                    $set: { 
                        advice: formData.advice || '', 
                        medicines: formData.medicines || [],
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );
            var data = await Prescription.findById(formData._id);

            return res.status(200).json({ success: true, message: 'Lưu đơn thuốc thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getPrescriptionByExaminationId: async (req, res) => {
        try{
            var data = await Prescription.aggregate([
                { $lookup: {
                    from: "tw_examinations",
                    localField: "examinationId",
                    foreignField: "_id",
                    as: "examinationInfo"
                }},
                { $lookup: {
                    from: "tw_customers",
                    localField: "examinationInfo.customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_users",
                    localField: "examinationInfo.dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] },
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerFullAddress": { $arrayElemAt: ["$customerInfo.fullAddress", 0] },
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                    }
                },
                { $project: { 
                    examinationInfo: 0,
                    dentistInfo: 0,
                    customerInfo: 0
                }},
                { $match: { 
                    $and: [
                        { examinationId: mongoose.Types.ObjectId(req.params.id) },
                    ]
                }}
            ]);

            return res.status(200).json({ success: true, data: data && data.length > 0 ? data[data.length - 1] : new Prescription() });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = CustomerController;