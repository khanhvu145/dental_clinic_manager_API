const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const Examination = require('../models/tw_Examination');
const Payment = require('../models/tw_Payment');
const PaymentSlip = require('../models/tw_PaymentSlip');
const Receipts = require('../models/tw_Receipts');
const moment = require('moment');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const exportExcel = require('../helpers/exportExcel');
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const PaymentSlipController = {
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = new Map([req.body.sorts.split("&&")]);
            var pages = req.body.pages;
            var dateFromF = null;
            var dateToF = null;
            
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(new Date(moment(filters.dateF[0]).format('YYYY/MM/DD')).setHours(0,0,0,0));
                dateToF = new Date(new Date(moment(filters.dateF[1]).format('YYYY/MM/DD')).setHours(23,59,0,0));
            }

            var data = await PaymentSlip.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                    dateToF ? { createdAt: { $lte: dateToF } } : {},
                    filters.statusF != 'all' ? { status: filters.statusF } : {},
                    // filters.typeF != 'all' ? { type: filters.typeF } : {},
                ]
            }).sort(sorts).limit(pages.size).skip(pages.from);
            
            var total = await PaymentSlip.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                    dateToF ? { createdAt: { $lte: dateToF } } : {},
                    filters.statusF != 'all' ? { status: filters.statusF } : {},
                    // filters.typeF != 'all' ? { type: filters.typeF } : {},
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
            if(formData.receivingUnit == null || formData.receivingUnit == '') {
                return res.status(200).json({ success: false, error: "Hãy nhập đơn vị nhận tiền" });
            }
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
            payment.receivingUnit = formData.receivingUnit;
            payment.addressUnit = formData.addressUnit;
            payment.originalDocuments = formData.originalDocuments || [];
            payment.createdBy = req.username ? req.username : '';
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
            const data = await PaymentSlip.findById(req.params.id);
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    complete: async(req, res) => {
        try{
            var formData = req.body;
            // Kiểm tra dữ liệu
            var existed = await PaymentSlip.findById(formData._id);
            if(existed == null) {
                return res.status(200).json({ success: false, error: 'Không có thông tin phiếu chi' });
            }
            if(existed.status != 'new'){
                return res.status(200).json({ success: false, error: 'Trạng thái phiếu chi không hợp lệ' });
            }
            //Xử lý
            await PaymentSlip.updateOne(
                { _id: formData._id }, 
                {
                    $set: { 
                        // note: formData.note || '',
                        status: 'completed',
                        date: formData.date || new Date(),
                        updatedAt: new Date(),
                        updatedBy: req.username ? req.username : ''
                    }
                }
            );

            var data = await PaymentSlip.findById(formData._id);
            return res.status(200).json({ success: true, message: 'Hoàn tất phiếu chi thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updateOriginalDocuments: async(req, res) => {
        try{
            var formData = req.body;
            // Kiểm tra dữ liệu
            var existed = await PaymentSlip.findById(formData.id);
            if(existed == null) {
                return res.status(200).json({ success: false, error: 'Không có thông tin phiếu chi' });
            }
            if(existed.status != 'new'){
                return res.status(200).json({ success: false, error: 'Trạng thái phiếu chi không hợp lệ' });
            }
            //Xử lý
            await PaymentSlip.updateOne(
                { _id: formData.id }, 
                {
                    $set: { 
                        originalDocuments: formData.originalDocuments,
                        updatedAt: new Date(),
                        updatedBy: req.username ? req.username : ''
                    }
                }
            );

            var data = await PaymentSlip.findById(formData.id);
            return res.status(200).json({ success: true, message: 'Cập nhật thành công thành công', data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    cancel: async (req, res) => {
        try {
            var formData = req.body;
            //#region Kiểm tra thông tin
            const exists = await PaymentSlip.findById(formData.id);
            if(exists == null) {
                return res.status(200).json({ success: false, error: "Không có thông tin phiếu chi" });
            }
            else{
                if(exists.status != 'new'){
                    return res.status(200).json({ success: false, error: "Trạng thái phiếu chi không hợp lệ" });
                }
            }
            //#endregion
            //#region Xử lý
            await PaymentSlip.updateOne(
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
                return res.status(200).json({ success: true, message: 'Hủy phiếu chi thành công', data: {} });
            })
            .catch((err) => {
                return res.status(200).json({ success: false, error: err });
            });
            //#endregion
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
            const data = await PaymentSlip.find({
                $and: [
                    { code: { $regex: filters.codeF, $options:"i" } },
                    dateFromF ? { createdAt: { $gte: dateFromF } } : {},
                    dateToF ? { createdAt: { $lte: dateToF } } : {},
                    filters.statusF != 'all' ? { status: filters.statusF } : {}
                ]
            }).sort(sorts);
            
            const workSheetColumnNames = [
                "Mã phiếu chi",
                "Số tiền chi",
                "Đơn vị nhận tiền",
                "Địa chỉ",
                "Chứng từ gốc",
                "Nội dung",
                "Trạng thái",
                "Ngày chi",
                "Ngày hủy",
                "Lý do hủy"
            ];

            const excelData = data.map(item => {
                return [
                    item.code || '',
                    item.amount || '',
                    item.receivingUnit || '',
                    item.addressUnit || '',
                    item.originalDocuments && item.originalDocuments.length > 0 ? item.originalDocuments.join(', ') : '',
                    item.content || '',
                    item.status == 'new' ? 'Mới' : item.status == 'completed' ? 'Hoàn thành' : item.status == 'cancelled' ? 'Đã hủy' : '',
                    item.date ? moment(item.date).format('DD/MM/YYYY') : '',
                    item.cancelledAt ? moment(item.cancelledAt).format('DD/MM/YYYY') : '',
                    item.cancelReason || '',
                ];
            });

            var file = await exportExcel(excelData, workSheetColumnNames, [], 'data');

            return res.status(200).json({ success: true, message: 'Xuất dữ liệu thành công', data: file });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getTemplateImport: async (req, res) => {
        try{
            const workSheetColumnNames = [
                "Đơn vị nhận tiền *",
                "Địa chỉ đơn vị",
                "Số tiền chi *",
                "Chứng từ gốc",
                "Nội dung chi *",
                "Trạng thái (new/completed) *"
            ];

            const workSheetColumnKeys = [
                "receivingUnit",
                "addressUnit",
                "amount",
                "originalDocuments",
                "content",
                "status"
            ];

            const excelData = [
                [
                    'Công ty ABC',
                    'Thủ Đức, tp.HCM',
                    100000000,
                    'CTG001,CTG002,CTG003',
                    'Thanh toán lương T1/2023',
                    'new'
                ]
            ];

            var file = await exportExcel(excelData, workSheetColumnNames, workSheetColumnKeys, 'data');

            return res.status(200).json({ success: true, message: 'Xuất dữ liệu thành công', data: file });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    import: async (req, res) => {
        try{
            if(req.file){
                const workSheetColumnNames = [
                    "Đơn vị nhận tiền *",
                    "Địa chỉ đơn vị",
                    "Số tiền chi *",
                    "Chứng từ gốc",
                    "Nội dung chi *",
                    "Trạng thái (new/completed) *",
                    "Kết quả"
                ];
                const workSheetColumnKeys = [
                    "receivingUnit",
                    "addressUnit",
                    "amount",
                    "originalDocuments",
                    "content",
                    "status",
                    "result"
                ];
                const excelData = [];
                var buffer = req.file.buffer;
                const workbook = xlsx.read(buffer);
                let worksheets = workbook.SheetNames.map(sheetName => {
                    return { sheetName, data: xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]) };
                });

                if(worksheets && worksheets[0].data && worksheets[0].data.length > 0){
                    for(var i = 1; i < worksheets[0].data.length; i++){
                        var error = 0;
                        var item = worksheets[0].data[i];
                        //#region Kiểm tra dữ liệu
                        if(item.receivingUnit == null || item.receivingUnit == '') {
                            error++;
                        }
                        if(item.amount == null || item.amount == '' || parseFloat(item.amount) == 0) {
                            error++;
                        }
                        if(item.content == null || item.content == '') {
                            error++;
                        }
                        if(item.status != 'new' && item.status != 'completed') {
                            error++;
                        }
                        if(error > 0){
                            excelData.push([
                                item.receivingUnit,
                                item.addressUnit,
                                item.amount,
                                item.originalDocuments,
                                item.content,
                                item.status,
                                'Thất bại. Dữ liệu nhập không đúng'
                            ]);
                            continue;
                        }
                        //#endregion

                        //#region Xử lý
                        const newPayment = await new PaymentSlip({
                            amount: item.amount ? parseFloat(item.amount) : parseFloat(0),
                            content: item.content,
                            status: item.status,
                            type: 'other',
                            receivingUnit: item.receivingUnit,
                            addressUnit: item.addressUnit,
                            originalDocuments: item.originalDocuments && item.originalDocuments.length > 0 ? item.originalDocuments.split(',') : [],
                            createdAt: Date.now(),
                            createdBy: req.username ? req.username : '',
                            date: item.status == 'completed' ? Date.now() : null,
                        }).save();
                        if(newPayment && newPayment._id){
                            await PaymentSlip.updateOne(
                                { _id: newPayment._id }, 
                                {
                                    $set: { 
                                        code: 'PC' + newPayment._id.toString().slice(-5).toUpperCase()
                                    }
                                }
                            );
                            excelData.push([
                                item.receivingUnit,
                                item.addressUnit,
                                item.amount,
                                item.originalDocuments,
                                item.content,
                                item.status,
                                'Thành công'
                            ]);
                            continue;
                        }
                        else{
                            excelData.push([
                                item.receivingUnit,
                                item.addressUnit,
                                item.amount,
                                item.originalDocuments,
                                item.content,
                                item.status,
                                'Thất bại. Có lỗi xảy ra trong quá trình nhập'
                            ]);
                            continue;
                        }
                        //#endregion
                    }
                }

                //Xuất file kết quả
                var file = await exportExcel(excelData, workSheetColumnNames, workSheetColumnKeys, 'data');

                return res.status(200).json({ success: true, message: 'Nhập dữ liệu thành công', data: file });
            }
            else{
                return res.status(400).json({ success: false, error: 'Có lỗi xảy ra' });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    }
};

module.exports = PaymentSlipController;