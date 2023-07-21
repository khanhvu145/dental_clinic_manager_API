const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const Receipts = require('../models/tw_Receipts');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const firebaseDB = require('../helpers/firebase');
const uploadFile = require('../helpers/uploadFile');
const getFileUpload = require('../helpers/getFileUpload');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const mongoose = require('mongoose');

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

                //#region Log
                // var log = [];
                // var isUpdate = false;
                // if(!IsNullOrEmpty(data.name)) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Họ và tên',
                //         oldvalue: '',
                //         newvalue: data.name
                //     };
                //     log.push(item);
                // }
                // if(!IsNullOrEmpty(data.physicalId)) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'CMND/CCCD',
                //         oldvalue: '',
                //         newvalue: data.physicalId
                //     };
                //     log.push(item);
                // }
                // if(data.dateOfIssue != null) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Ngày cấp',
                //         oldvalue: '',
                //         newvalue: moment(data.dateOfIssue).format('DD/MM/YYYY')
                //     };
                //     log.push(item);
                // }
                // if(!IsNullOrEmpty(data.placeOfIssue)) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Nơi cấp',
                //         oldvalue: '',
                //         newvalue: data.placeOfIssue
                //     };
                //     log.push(item);
                // }
                // if(!IsNullOrEmpty(data.phone)) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Số điện thoại',
                //         oldvalue: '',
                //         newvalue: data.phone
                //     };
                //     log.push(item);
                // }
                // if(!IsNullOrEmpty(data.email)) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Email',
                //         oldvalue: '',
                //         newvalue: data.email
                //     };
                //     log.push(item);
                // }
                // if(data.birthday != null) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Ngày sinh',
                //         oldvalue: '',
                //         newvalue: moment(data.birthday).format('DD/MM/YYYY')
                //     };
                //     log.push(item);
                // }
                // if(!IsNullOrEmpty(data.gender)) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Giới tính',
                //         oldvalue: '',
                //         newvalue: data.gender == 'male' ? 'Nam' : data.gender == 'female' ? 'Nữ' : 'Khác'
                //     };
                //     log.push(item);
                // }
                // if(!IsNullOrEmpty(data.address.building)) {
                //     isUpdate = true;
                //     var item = {
                //         column: 'Địa chỉ',
                //         oldvalue: '',
                //         newvalue: data.address.building
                //     };
                //     log.push(item);
                // }
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
            if(fileList != null && fileList.length > 0){
                console.log('Step 0.1')
                if(formData.attachFiles != null && formData.attachFiles.length > 0){
                    console.log('Step 0.2')
                    var dem = 0;
                    var dem2 = 0;
                    for(let i = 0; i < formData.attachFiles.length; i++){
                        console.log('Step 1 - Bắt đầu vòng lặp (ngoài) thứ ' + i)
                        var dem = dem2;
                        var lengthArr = formData.attachFiles[i].fileList.length;
                        formData.attachFiles[i].files = [];
                        console.log('Step 2 - Kiểm tra các biến ' + dem + ' - ' + dem2 + ' - ' + lengthArr)
                        for(let j = dem; j < lengthArr + dem; j++){
                            console.log('Step 3 - Bắt đầu vòng lặp (trong) thứ ' + j)
                            dem2 += 1;
                            var file = fileList[j];
                            console.log('Step 4 - Kiểm tra các biến ' + dem + ' - ' + dem2 + ' - ' + file)
                            if(file){
                                var fileName = Date.now().toString() + '-' + file.originalname;
                                var path = firebaseDB.bucket.file('examination/' + formData.customerId + '/' + fileName);
                                var buffer = file.buffer;
                                var image = await uploadFile(path, buffer);
                                var fileURL = await getFileUpload(path);
                                await formData.attachFiles[i].files.push(fileURL[0]);
                                console.log('Step 5 - Gán file thành công')
                            }
                        }
                    }
                }
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
            if(formData.diagnosisTreatment != null && formData.diagnosisTreatment.length > 0){
                formData.diagnosisTreatment = formData.diagnosisTreatment.map(x => {
                    return {
                      ...x,
                      isJaw: x.isJaw == 'true' ? true : false
                    }
                });
            }
            const newData = await new Examination({
                customerId: formData.customerId, 
                dentistId: formData.dentistId, 
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
                note: formData.note, 
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

            //#region Tạo thanh toán
            if(data){
                //Chuẩn hóa dữ liệu
                const paymentData = {
                    examinationId: data._id,
                    customerId: data.customerId,
                    amount: data.totalAmount,
                    paidAmount: parseFloat(0),
                    remainAmount: data.totalAmount,
                    status: 'unpaid',
                    createdAt: Date.now(),
                    createdBy: data.createdBy
                };
                var payment = await Payment.createPayment(paymentData);
                console.log(payment);
                if(payment.code <= 0){
                    return res.status(200).json({ success: false, error: payment.error });
                }
            }
            //#endregion

            //#region Ghi log
            if(data){
                var content = {
                    code: data.code,
                };
                await CustomerLog.CreateLog(data.customerId, 'examination', data._id, content, formData.createdBy);
            }
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
    getByQueryExamination: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = req.body.sorts;
            var pages = req.body.pages;
            var listDentistId = filters.dentistsF.map(x => mongoose.Types.ObjectId(x));
            var dateFromF = null;
            var dateToF = null;
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(moment(filters.dateF[0]).format('YYYY/MM/DD'));
                dateToF = new Date(moment(filters.dateF[1]).format('YYYY/MM/DD'));
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
            // var newData = [];
            // if(data && data.length > 0){
            //     for(let i = 0; i < data.length; i++){
            //         if(data[i].type == 'examination'){
            //             var examinationData = await Examination.findById(data[i].targetId);
            //             if(examinationData){
            //                 data[i].code = examinationData.code;
            //                 // console.log(data[i].code)
            //                 newData.push(data[i]);
            //                 console.log(newData)
            //             }
            //         }
            //         else if(data[i].type == 'payment'){
            //             var paymentData = await Receipts.findById(data[i].targetId);
            //             if(paymentData){
            //                 data[i].code = paymentData.code;
            //                 newData.push(data[i]);
            //                 console.log(newData)
            //             }
            //         }
            //     }
            //     // newData = await data.map(async(item) => {
            //     //     if(item.type == 'examination'){
            //     //         var examinationData = await Examination.findById(mongoose.Types.ObjectId(item.targetId));
            //     //         if(examinationData){
            //     //             return {
            //     //                 ...item,
            //     //                 code: examinationData.code
            //     //             }
            //     //         }
            //     //     }
            //     //     else if(item.type == 'payment'){
            //     //         var paymentData = await Receipts.findById(mongoose.Types.ObjectId(item.targetId));
            //     //         if(paymentData){
            //     //             return {
            //     //                 ...item,
            //     //                 code: paymentData.code
            //     //             }
            //     //         }
            //     //     }
            //     //     else{
            //     //         return {
            //     //             ...item
            //     //         }
            //     //     }
            //     // });
            // }

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
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] }
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { 
                    $and: [
                        { _id: mongoose.Types.ObjectId(req.params.id) },
                    ]
                }},
                { $limit: 1 },
            ]);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
}

module.exports = CustomerController;