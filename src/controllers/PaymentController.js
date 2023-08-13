const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const Receipts = require('../models/tw_Receipts');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const mongoose = require('mongoose');

const PaymentController = {
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = req.body.sorts;
            var pages = req.body.pages;
            var dateFromF = null;
            var dateToF = null;
            
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(moment(filters.dateF[0]).format('YYYY/MM/DD'));
                dateToF = new Date(moment(filters.dateF[1]).format('YYYY/MM/DD'));
            }
            
            var data = await Payment.aggregate([
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
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] },
                        "examinationStatus": { $arrayElemAt: ["$examinationInfo.status", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0
                }},
                { $match: { 
                    $and: [
                        { customerId: mongoose.Types.ObjectId(filters.customerF) },
                        { examinationCode: { $regex: filters.examinationCodeF, $options:"i" } },
                        dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                        dateToF ? { createdAt: { $lte: dateToF } } : {},
                        (filters.statusF.length > 0 && filters.statusF != null) ? { 
                            status: { $in: filters.statusF }
                        } : {},
                        { examinationStatus: { $ne: 'cancelled' } }
                    ]
                }},
                { $sort: { createdAt: sorts }},
                { $limit: (pages.from + pages.size) },
                { $skip: pages.from }
            ]);
            
            var total = await Payment.aggregate([
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
                        "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] },
                        "examinationStatus": { $arrayElemAt: ["$examinationInfo.status", 0] }
                    }
                },
                { $project: { 
                    customerInfo: 0,
                    examinationInfo: 0
                }},
                { $match: { 
                    $and: [
                        { customerId: mongoose.Types.ObjectId(filters.customerF) },
                        { examinationCode: { $regex: filters.examinationCodeF, $options:"i" } },
                        dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                        dateToF ? { createdAt: { $lte: dateToF } } : {},
                        (filters.statusF.length > 0 && filters.statusF != null) ? { 
                            status: { $in: filters.statusF }
                        } : {},
                        { examinationStatus: { $ne: 'cancelled' } }
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
    confirmPayment: async(req, res) => {
        try{
            var formData = req.body;
            var fileList = req.files;
            //#region Kiểm tra đầu vào
            //Kiểm tra thanh toán
            const payment = await Payment.findById(formData.paymentId);
            if(payment == null) {
                return res.status(200).json({ success: false, error: "Thông tin thanh toán không tồn tại" });
            }
            if(payment.remainAmount <= 0){
                return res.status(200).json({ success: false, error: "Hóa đơn thanh thanh toán đã được thanh toán đủ" });
            }
            //Kiểm tra số tiền thanh toán
            if(formData.paidAmount <= 0 || formData.paidAmount > payment.remainAmount) {
                return res.status(200).json({ success: false, error: "Số tiền thanh toán không hợp lệ" });
            }
            //Kiểm tra hình thức thanh toán 
            if(IsNullOrEmpty(formData.methodFee)) {
                return res.status(200).json({ success: false, error: "Vui lòng chọn hình thức thanh toán" });
            }
            //#endregion

            //#region Cập nhật thông tin thanh toán
            var paidAmount = parseFloat(payment.paidAmount) + parseFloat(formData.paidAmount);
            var remainAmount = parseFloat(payment.remainAmount) - parseFloat(formData.paidAmount);
            var status = remainAmount <= 0 ? 'paid' : 'partialPaid';
            await Payment.updateOne(
                { _id: payment._id }, 
                {
                    $set: { 
                        paidAmount: parseFloat(paidAmount),
                        remainAmount: parseFloat(remainAmount),
                        status: status,
                        updatedAt: Date.now(),
                        updatedBy: formData.updatedBy ? formData.updatedBy : ''
                    }
                }
            );
            var paymentData = await Payment.findById(payment._id);
            //#endregion
            
            //#region Tạo phiếu thu
            //Chuẩn hóa dữ liệu
            const receiptsData = {
                paymentId: payment._id,
                examinationId: payment.examinationId,
                customerId: payment.customerId,
                amount: formData.paidAmount,
                methodFee: formData.methodFee,
                note: formData.note,
                status: 'paid',
                createdAt: Date.now(),
                createdBy: formData.updatedBy
            };
            var receipts = await Receipts.createReceipts(receiptsData, fileList);
            console.log(receipts);
            if(receipts.code <= 0){
                return res.status(200).json({ success: false, error: receipts.error });
            }
            //#endregion

            //#region Log
            var log = [];
            var isUpdate = false;
            
            if(receipts && receipts.data) {
                isUpdate = true;
                var item = {
                    column: 'Xác nhận thanh toán',
                    oldvalue: {},
                    newvalue: {
                        id: receipts.data._id,
                        code: receipts.data.code,
                        amount: receipts.data.amount
                    }
                };
                log.push(item);
            }
            
            if (isUpdate)
            {
                await CustomerLog.CreateLog(receipts.data.customerId, 'payment', log, 'confirm', formData.updatedBy);
            }
            //#endregion

            return res.status(200).json({ success: true, message: 'Thanh toán thành công', paymentData: paymentData, receiptsData: receipts.data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
};

module.exports = PaymentController;