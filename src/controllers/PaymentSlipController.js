const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const PaymentSlip = require('../models/tw_PaymentSlip');
const Receipts = require('../models/tw_Receipts');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const mongoose = require('mongoose');

const PaymentSlipController = {
    getByQuery: async(req, res) => {
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

            var data = await PaymentSlip.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    dateFromF ? { date: { $gte: dateFromF } } : {},
                    dateToF ? { date: { $lte: dateToF } } : {},
                    filters.statusF != 'all' ? { status: filters.statusF } : {},
                    filters.typeF != 'all' ? { type: filters.typeF } : {},
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);
            
            var total = await PaymentSlip.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    dateFromF ? { date: { $gte: dateFromF } } : {},
                    dateToF ? { date: { $lte: dateToF } } : {},
                    filters.statusF != 'all' ? { status: filters.statusF } : {},
                    filters.typeF != 'all' ? { type: filters.typeF } : {},
                ]
            }).count();
            
            return res.status(200).json({ success: true, data: data, total: total });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    create: async(req, res) => {
        try{
            var formData = req.body;
            /** Kiểm tra điều kiện đầu vào */
            if(formData.amount == null || formData.amount == '' || parseFloat(formData.amount) == 0) {
                return res.status(200).json({ success: false, error: "Hãy nhập số tiền chi" });
            }
            if(formData.content == null || formData.content == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập nội dung chi" });
            }

            //Chuẩn hóa dữ liệu
            var payment = new PaymentSlip();
            payment.amount = formData.amount;
            payment.content = formData.content;
            payment.status = 'new';
            payment.type = 'other';
            payment.createdBy = formData.createdBy ? formData.createdBy : '';
            //Xử lý
            const data = await PaymentSlip.createPaymentSlip(payment);

            if(data.code <= 0){
                return res.status(200).json({ success: false, error: data.error });
            }
            
            return res.status(200).json({ success: true, message: 'Tạo thành công', data: data.data });
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
};

module.exports = PaymentSlipController;