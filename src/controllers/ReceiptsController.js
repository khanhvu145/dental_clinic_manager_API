const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const Receipts = require('../models/tw_Receipts');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const exportExcel = require('../helpers/exportExcel');
const mongoose = require('mongoose');
const XLSX = require("xlsx");

const ReceiptsController = {
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = req.body.sorts;
            var pages = req.body.pages;
            var dateFromF = null;
            var dateToF = null;
            
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(new Date(moment(filters.dateF[0]).format('YYYY/MM/DD')).setHours(0,0,0,0));
                dateToF = new Date(new Date(moment(filters.dateF[1]).format('YYYY/MM/DD')).setHours(23,59,0,0));
            }
            
            var data = await Receipts.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_examinations",
                    localField: "examinationId",
                    foreignField: "_id",
                    as: "examinationInfo"
                }},
                {
                    $addFields: {
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] },
                        "diagnosisTreatment": { $arrayElemAt: ["$examinationInfo.diagnosisTreatment", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0
                }},
                { $match: { 
                    $and: [
                        { code: { $regex: filters.codeF, $options:"i" } },
                        { examinationCode: { $regex: filters.examinationCodeF, $options:"i" } },
                        { $or: [
                                { customerName: { $regex: filters.customerF, $options:"i" } },
                                { customerCode: { $regex: filters.customerF, $options:"i" } },
                            ] 
                        },
                        dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                        dateToF ? { createdAt: { $lte: dateToF } } : {},
                        filters.statusF != 'all' ? { status: filters.statusF } : {},
                    ]
                }},
                { $sort: { createdAt: sorts }},
                { $limit: (pages.from + pages.size) },
                { $skip: pages.from }
            ]);
            
            var total = await Receipts.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_examinations",
                    localField: "examinationId",
                    foreignField: "_id",
                    as: "examinationInfo"
                }},
                {
                    $addFields: {
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0
                }},
                { $match: { 
                    $and: [
                        { code: { $regex: filters.codeF, $options:"i" } },
                        { examinationCode: { $regex: filters.examinationCodeF, $options:"i" } },
                        { $or: [
                                { customerName: { $regex: filters.customerF, $options:"i" } },
                                { customerCode: { $regex: filters.customerF, $options:"i" } },
                            ] 
                        },
                        dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                        dateToF ? { createdAt: { $lte: dateToF } } : {},
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
    getById: async(req, res) => {
        try{
            var data = await Receipts.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_examinations",
                    localField: "examinationId",
                    foreignField: "_id",
                    as: "examinationInfo"
                }},
                {
                    $addFields: {
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                        "diagnosisTreatment": { $arrayElemAt: ["$examinationInfo.diagnosisTreatment", 0] },
                        "totalAmount": { $arrayElemAt: ["$examinationInfo.totalAmount", 0] },
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0,
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
    },
    getReceiptsByPaymentId: async(req, res) => {
        try{
            var data = await Receipts.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_examinations",
                    localField: "examinationId",
                    foreignField: "_id",
                    as: "examinationInfo"
                }},
                {
                    $addFields: {
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] },
                        "diagnosisTreatment": { $arrayElemAt: ["$examinationInfo.diagnosisTreatment", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0
                }},
                { $match: { 
                    $and: [
                        { paymentId: mongoose.Types.ObjectId(req.body.id) },
                        { status: { $ne: 'cancelled' } }
                    ]
                }},
                { $sort: { createdAt: req.body.sorts }},
                { $limit: (req.body.pages.from + req.body.pages.size) },
                { $skip: req.body.pages.from }
            ]);

            var total = await Receipts.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_examinations",
                    localField: "examinationId",
                    foreignField: "_id",
                    as: "examinationInfo"
                }},
                {
                    $addFields: {
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0
                }},
                { $match: { 
                    $and: [
                        { paymentId: mongoose.Types.ObjectId(req.body.id) },
                        { status: { $ne: 'cancelled' } }
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
    cancel: async (req, res) => {
        try {
            var formData = req.body;
            //#region Kiểm tra thông tin
            const exists = await Receipts.findById(formData.id);
            if(exists == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu thu" });
            }
            else{
                if(exists.status == 'cancelled'){
                    return res.status(200).json({ success: false, error: "Phiếu thu đã được hủy. Không thể hủy." });
                }
            }
            //#endregion
            //#region Xử lý
            var result = await Receipts.cancelReceipts(formData.id, formData.cancelReason, req.username);
            if(result && result.code <= 0){
                return res.status(200).json({ success: false, error: result.error });
            }
            //#endregion
            return res.status(200).json({ success: true, message: 'Hủy phiếu thu thành công', data: {} });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    export: async (req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = req.body.sorts;
            var dateFromF = null;
            var dateToF = null;
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(new Date(moment(filters.dateF[0]).format('YYYY/MM/DD')).setHours(0,0,0,0));
                dateToF = new Date(new Date(moment(filters.dateF[1]).format('YYYY/MM/DD')).setHours(23,59,0,0));
            }

            //Lấy dữ liệu
            const data = await Receipts.aggregate([
                { $lookup: {
                    from: "tw_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerInfo"
                }},
                { $lookup: {
                    from: "tw_examinations",
                    localField: "examinationId",
                    foreignField: "_id",
                    as: "examinationInfo"
                }},
                {
                    $addFields: {
                        "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                        "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                        "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                        "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                        "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                        "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0
                }},
                { $match: { 
                    $and: [
                        { code: { $regex: filters.codeF, $options:"i" } },
                        { examinationCode: { $regex: filters.examinationCodeF, $options:"i" } },
                        { $or: [
                                { customerName: { $regex: filters.customerF, $options:"i" } },
                                { customerCode: { $regex: filters.customerF, $options:"i" } },
                            ] 
                        },
                        dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                        dateToF ? { createdAt: { $lte: dateToF } } : {},
                        filters.statusF != 'all' ? { status: filters.statusF } : {},
                    ]
                }},
                { $sort: { createdAt: sorts }}
            ]);
            
            const workSheetColumnNames = [
                "Mã phiếu thu",
                "Ngày thanh toán",
                "Số tiền thanh toán",
                "Hình thức thanh toán",
                "Mã phiếu khám",
                "Mã khách hàng",
                "Tên khách hàng",
                "CMND/CCCD",
                "Số điện thoại",
                "Trạng thái",
                "Ghi chú"
            ];

            const excelData = data.map(item => {
                return [
                    item.code,
                    moment(item.createdAt).format('DD/MM/YYYY'),
                    item.amount,
                    item.methodFee == 'transfer' ? 'Chuyển khoản' : item.methodFee == 'cash' ? 'Tiền mặt' : '',
                    item.examinationCode,
                    item.customerCode,
                    item.customerName,
                    item.customerPhysicalId,
                    item.customerPhone,
                    item.status == 'paid' ? 'Đã thanh toán' : item.status == 'cancelled' ? 'Đã hủy' : '',
                    item.note,
                ];
            });

            var file = await exportExcel(excelData, workSheetColumnNames, [], 'data');

            return res.status(200).json({ success: true, message: 'Xuất dữ liệu thành công', data: file });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = ReceiptsController;