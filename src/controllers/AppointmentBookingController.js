const { forEach } = require('lodash');
const models = require('../models/tw_Appointment_Booking');
const Appointment = models.AppointmentModel;
const AppointmentLog = models.AppointmentLogModel;
const AppointmentConfigs = require('../models/tw_Appointment_Config');
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const GeneralConfig = require('../models/tw_GeneralConfig');
const User = require('../models/tw_User');
const mongoose = require('mongoose');
const moment = require('moment');
const sendMail = require('../helpers/sendMail');
const path = require('path');
const fs = require('fs');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const convertDateToCron = require('../helpers/convertDateToCron');
const CronJob = require('cron').CronJob;

const AppointmentBookingController = {
    create: async(req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra đầu vào
            //Kiểm tra khách hàng
            if(formData.mainCustomer == null || formData.mainCustomer._id == null || formData.mainCustomer._id == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn khách hàng" });
            }
            else{
                var customerInfo =  await Customer.findById(formData.mainCustomer._id);
                if(customerInfo == null){
                    return res.status(200).json({ success: false, error: "Không có thông tin khách hàng" });
                }
            }
            //Kiểm tra nha sĩ
            if(formData.dentistId == null || formData.dentistId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nha sĩ phụ trách" });
            }
            //Kiểm tra thời gian
            if(formData.date == null || formData.date == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            if(formData.timeFrom == null || formData.timeFrom == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            if(formData.timeTo == null || formData.timeTo == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            //Nội dung
            if(formData.content == null || formData.content == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nội dung lịch hẹn" });
            }
            //#endregion
        
            //#region Kiểm tra thời gian đặt hẹn
            var checkCanBook = await Appointment.checkCanBook(formData, false);
            if(checkCanBook < 1){
                if(checkCanBook == -1){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn không hợp lệ" });
                }
                else if(checkCanBook == -2){
                    return res.status(200).json({ success: false, error: "Khoảng thời gian không hợp lệ" });
                }
                else if(checkCanBook == -3){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn bị trùng" });
                }
                else if(checkCanBook == -4){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn nằm ngoài thời gian làm việc" });
                }
                else{
                    return res.status(200).json({ success: false, error: "Có lỗi xảy ra trong quá trình đặt lịch hẹn" });
                }
            }
            //#endregion 

            //#region Xử lý
            //Chuẩn hóa data
            var customerBooking = {
                _id: formData.mainCustomer._id,
                code: formData.mainCustomer.code,
                name: formData.mainCustomer.name,
                physicalId: formData.mainCustomer.physicalId,
                dateOfIssue: formData.mainCustomer.dateOfIssue,
                placeOfIssue: formData.mainCustomer.placeOfIssue,
                email: formData.mainCustomer.email,
                phone: formData.mainCustomer.phone,
                birthday: formData.mainCustomer.birthday,
                gender: formData.mainCustomer.gender,
                fullAddress: formData.mainCustomer.fullAddress
            }
            formData.mainCustomer = customerBooking;
            var data = await Appointment.createBooking(formData, req.username);
            if(data.code <= 0){
                return res.status(200).json({ success: false, error: data.error });
            }
            //#endregion
            //#region Log khách hàng
            if(data && data.data){
                var log = [];
                var item = {
                    column: 'Đặt hẹn',
                    oldvalue: '',
                    newvalue: data.data.code || ''
                };
                log.push(item);
                await CustomerLog.CreateLog(data.data.mainCustomer._id, 'booking', log, 'create', req.username);
            }
            //#endregion

            return res.status(200).json({ success: true, message: 'Đặt hẹn thành công', data: data.data, checkCanBook: checkCanBook });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    updateStatusToNoArrivedJob: async(req, res) => {
        try{
            var currentDate = new Date(new Date().setHours(0,0,0,0));
            var appointments = await Appointment.find({
                status: 'new',
                dateTimeFrom: { $lt: currentDate }
            }, { projection: { _id: 1 } });
            if(appointments && appointments.length > 0){
                var ids = appointments.map(m => m._id);
                const updated = await Appointment.updateMany(
                    { _id: { $in: ids } },
                    {
                        $set: {
                            status: 'notarrived',
                            updatedAt: Date.now(),
                            updatedBy: 'System'
                        }
                    }
                );
                if(updated){
                    console.log('matchedCount: ' + updated.matchedCount);
                    console.log('modifiedCount: ' + updated.modifiedCount);
                }
            }
        }
        catch(err){
            console.log('Có lỗi xảy ra khi chạy job cập nhật lịch hẹn: ' + err);
        }
    },
    getEmptyCalendar: async(req, res) => {
        try{
            var formData = req.body;
            var listDentistId = formData.dentistsF.map(x => mongoose.Types.ObjectId(x));
            var data = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] },
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { 
                    $and: [
                        { date: { $gte: new Date(new Date(`${formData.dateF}`).setHours(0,0,0,0)) } },
                        { date: { $lte: new Date(new Date(`${formData.dateF}`).setHours(23,59,0,0)) } },
                        { status: { $ne: 'cancelled' } },
                        (formData.dentistsF.length > 0 && formData.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {},
                        (formData.currentId != null && formData.currentId != '') ? { 
                            _id: { $ne: mongoose.Types.ObjectId(formData.currentId) }
                        } : {}
                    ]
                }}
            ]);

            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getByQuery: async(req, res) => {
        try{
            var filters = req.body.filters;
            var sorts = req.body.sorts.split("&&");
            var pages = req.body.pages;
            var listDentistId = filters.dentistsF.map(x => mongoose.Types.ObjectId(x));
            var dateFromF = null;
            var dateToF = null;
            if(filters.dateF != null && filters.dateF != '' && filters.dateF.length > 0){
                dateFromF = new Date(moment(filters.dateF[0]).format('YYYY/MM/DD HH:mm'));
                dateToF = new Date(moment(filters.dateF[1]).format('YYYY/MM/DD HH:mm'));
            }
            var data = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] }
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { 
                    $and: [
                        { code: { $regex: filters.codeF, $options:"i" } },
                        { $or: [
                                { 'mainCustomer.name': { $regex: filters.customersF, $options:"i" } },
                                { 'mainCustomer.phone': { $regex: filters.customersF, $options:"i" } },
                                { 'mainCustomer.physicalId': { $regex: filters.customersF, $options:"i" } },
                                { 'mainCustomer.code': { $regex: filters.customersF, $options:"i" } },
                            ] 
                        },
                        dateFromF ? { dateTimeFrom: { $gte: dateFromF } } : {},
                        dateToF ? { dateTimeFrom: { $lte: dateToF } } : {},
                        (filters.dentistsF.length > 0 && filters.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {},
                        (filters.statusF.length > 0 && filters.statusF != null) ? { 
                            status: { $in: filters.statusF }
                        } : {},
                    ]
                }},
                { $sort: sorts[0] == 'dateTimeFrom' ? { dateTimeFrom: Number(sorts[1]) } : { createdAt: Number(sorts[1]) }},
                { $limit: (pages.from + pages.size) },
                { $skip: pages.from }
            ]);
            var total = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] },
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { 
                    $and: [
                        { code: { $regex: filters.codeF, $options:"i" } },
                        { $or: [
                                { 'mainCustomer.name': { $regex: filters.customersF, $options:"i" } },
                                { 'mainCustomer.phone': { $regex: filters.customersF, $options:"i" } },
                                { 'mainCustomer.physicalId': { $regex: filters.customersF, $options:"i" } },
                                { 'mainCustomer.code': { $regex: filters.customersF, $options:"i" } },
                            ] 
                        },
                        dateFromF ? { date: { $gte: dateFromF } } : {},
                        dateToF ? { date: { $lte: dateToF } } : {},
                        (filters.dentistsF.length > 0 && filters.dentistsF != null) ? { 
                            dentistId: { $in: listDentistId }
                        } : {},
                        (filters.statusF.length > 0 && filters.statusF != null) ? { 
                            status: { $in: filters.statusF }
                        } : {},
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
            var data = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] },
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { _id: mongoose.Types.ObjectId(req.body.id) } }
            ]);
            return res.status(200).json({ success: true, data: data && data.length > 0 ? data[0] : new Appointment() });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    update: async(req, res) => {
        try{
            var formData = req.body;
            //#region Kiểm tra đầu vào
            // Kiểm tra tồn tại
            const exist = await Appointment.findById(formData._id);
            if(exist == null) {
                return res.status(200).json({ success: false, error: "Lịch hẹn không tồn tại" });
            }
            //Kiểm tra nha sĩ
            if(formData.dentistId == null || formData.dentistId == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nha sĩ phụ trách" });
            }
            //Kiểm tra thời gian
            if(formData.date == null || formData.date == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            if(formData.timeFrom == null || formData.timeFrom == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            if(formData.timeTo == null || formData.timeTo == ''){
                return res.status(200).json({ success: false, error: "Hãy chọn thời gian hẹn" });
            }
            //Nội dung
            if(formData.content == null || formData.content == '') {
                return res.status(200).json({ success: false, error: "Hãy chọn nội dung lịch hẹn" });
            }
            //#endregion

            //#region Kiểm tra thời gian đặt hẹn
            var checkCanBook = await Appointment.checkCanBook(formData, true);
            if(checkCanBook < 1){
                if(checkCanBook == -1){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn không hợp lệ" });
                }
                else if(checkCanBook == -2){
                    return res.status(200).json({ success: false, error: "Khoảng thời gian không hợp lệ" });
                }
                else if(checkCanBook == -3){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn bị trùng" });
                }
                else if(checkCanBook == -4){
                    return res.status(200).json({ success: false, error: "Thời gian đặt hẹn nằm ngoài thời gian làm việc" });
                }
                else{
                    return res.status(200).json({ success: false, error: "Có lỗi xảy ra trong quá trình đặt lịch hẹn" });
                }
            }
            //#endregion 

            //#region Xử lý
            var data = await Appointment.updateBooking(formData, exist, req.username);
            if(data.code <= 0){
                return res.status(200).json({ success: false, error: data.error });
            }
            //#endregion

            //#region Log khách hàng
            if(data && data.data){
                var log = [];
                var item = {
                    column: 'Thay đổi lịch hẹn',
                    oldvalue: '',
                    newvalue: data.data.code || ''
                };
                log.push(item);
                await CustomerLog.CreateLog(data.data.mainCustomer._id, 'booking', log, 'update', req.username);
            }
            //#endregion

            return res.status(200).json({ success: true, message: 'Chỉnh sửa thành công', data: data.data, checkCanBook: checkCanBook });
        }
        catch{
            return res.status(400).json({ success: false, error: err });
        }
    },
    getLogs: async(req, res) => {
        try{
            const data = await AppointmentLog.find({ appointmentId: req.params.id }).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    sendMail: async(req, res) => {
        try{
            var formData = req.body;
            var successCount = 0;
            var errorCount = 0;
            var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/RemindEmailTemplate.html'),{encoding:'utf-8'});
            if(formData.ids && formData.ids.length > 0){
                for(var i = 0; i < formData.ids.length; i++){
                    //#region Kiểm tra điều kiện
                    const exist = await Appointment.findOne({ 
                        _id: mongoose.Types.ObjectId(formData.ids[i]),
                        status: 'new'
                    });
                    if(exist == null) {
                        errorCount++;
                        continue;
                    }
                    if(exist.mainCustomer == null || IsNullOrEmpty(exist.mainCustomer.email)) {
                        errorCount++;
                        continue;
                    }
                    //#endregion
                    //#region Xử lý
                    var dentistInfo =  await User.findById(exist.dentistId);
                    var contentInfo =  await GeneralConfig.findById(exist.content);  
                    if(template){
                        template = template.replace(/{customerName}/g, exist.mainCustomer != null ? exist.mainCustomer.name : '');
                        template = template.replace(/{code}/g, exist.code);
                        template = template.replace(/{date}/g, moment(exist.date).format('DD/MM/YYYY').toString());
                        template = template.replace(/{time}/g, `${exist.timeFrom} - ${exist.timeTo}`);
                        template = template.replace(/{dentistName}/g, dentistInfo != null ? dentistInfo.name : '');
                        template = template.replace(/{content}/g, contentInfo != null ? contentInfo.value : '');

                        var timeRemind = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
                        var expireTime = moment(timeRemind).add(10, 's')._d;
                        var dateCronRemind = convertDateToCron(expireTime);
                        var job = await new CronJob(
                            dateCronRemind,
                            async function(){
                                await sendMail({ to: exist.mainCustomer.email, subject: 'THƯ NHẮC HẸN', body: template });
                                //#region log
                                var log = [];
                                var item = {
                                    column: 'Gửi lúc',
                                    oldvalue: '',
                                    newvalue: moment().format('DD/MM/YYYY hh:mm')
                                };
                                log.push(item);
                                await AppointmentLog.CreateLog(exist._id, 'Gửi nhắc hẹn', log, req.username);
                                //#endregion
                            },
                            null,
                            true,
                            'Asia/Ho_Chi_Minh'
                        );
                        await job.start();
                        successCount++;
                    }
                    else{
                        errorCount++;
                        continue;
                    }
                    //#endregion
                }
                return res.status(200).json({ success: true, successCount: successCount, errorCount: errorCount });
            }
            else{
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    confirmBooking: async(req, res) => {
        try{
            var formData = req.body;
            var successCount = 0;
            var errorCount = 0;
            if(formData.ids && formData.ids.length > 0){
                for(var i = 0; i < formData.ids.length; i++){
                    const updated = await Appointment.updateOne(
                        { 
                            _id: mongoose.Types.ObjectId(formData.ids[i]),
                            status: 'new'
                        },
                        {
                            $set: {
                                status: 'arrived',
                                confirmAt: Date.now(),
                                confirmBy: req.username,
                                updatedAt: Date.now(),
                                updatedBy: req.username
                            }
                        }
                    );
                    if(updated.modifiedCount > 0 && updated.acknowledged == true){
                        var data = await Appointment.findById(formData.ids[i]);
                        //Logs
                        await AppointmentLog.CreateLog(data._id, 'Xác nhận đến khám', [], req.username);

                        //#region Log khách hàng
                        if(data){
                            var log = [];
                            var item = {
                                column: 'Xác nhận đến khám',
                                oldvalue: '',
                                newvalue: data.code || ''
                            };
                            log.push(item);
                            await CustomerLog.CreateLog(data.mainCustomer._id, 'booking', log, 'checkin', req.username);
                        }
                        //#endregion
                        successCount++;
                    }
                    else{
                        errorCount++;
                        continue;
                    }
                }

                return res.status(200).json({ success: true, successCount: successCount, errorCount: errorCount });
            }
            else{
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    completeBooking: async(req, res) => {
        try{
            var formData = req.body;
            var successCount = 0;
            var errorCount = 0;
            if(formData.ids && formData.ids.length > 0){
                for(var i = 0; i < formData.ids.length; i++){
                    const updated = await Appointment.updateOne(
                        { 
                            _id: mongoose.Types.ObjectId(formData.ids[i]),
                            status: 'arrived'
                        },
                        {
                            $set: {
                                status: 'completed',
                                completedAt: Date.now(),
                                completedBy: req.username,
                                updatedAt: Date.now(),
                                updatedBy: req.username
                            }
                        }
                    );
                    if(updated.modifiedCount > 0 && updated.acknowledged == true){
                        var data = await Appointment.findById(formData.ids[i]);
                        //#region Gửi email thông báo KH
                        if(data.mainCustomer && !IsNullOrEmpty(data.mainCustomer.email)){
                            const NOTIFY_COMPLETE_APPOINTMENT = await AppointmentConfigs.findOne({ key: 'NOTIFY_COMPLETE_APPOINTMENT' });
                            if(NOTIFY_COMPLETE_APPOINTMENT && NOTIFY_COMPLETE_APPOINTMENT.value == 'yes'){
                                var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/NotifyCompleteAppointmentTemplate.html'),{encoding:'utf-8'});
                                if(template){
                                    template = template.replace(/{customerName}/g, data.mainCustomer != null ? data.mainCustomer?.name : '');
                    
                                    var timeRemind = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
                                    var expireTime = moment(timeRemind).add(10, 's')._d;
                                    var dateCronRemind = convertDateToCron(expireTime);
                    
                                    var job2 = await new CronJob(
                                        dateCronRemind,
                                        async function(){
                                            await sendMail({ to: data.mainCustomer?.email, subject: 'HOÀN THÀNH LỊCH HẸN', body: template });
                                        },
                                        null,
                                        true,
                                        'Asia/Ho_Chi_Minh'
                                    );
                                    await job2.start();
                                }
                            }
                        }
                        //#endregion

                        //Logs
                        await AppointmentLog.CreateLog(data._id, 'Hoàn thành lịch hẹn', [], req.username);

                        //#region Log khách hàng
                        if(data){
                            var log = [];
                            var item = {
                                column: 'Hoàn thành lịch hẹn',
                                oldvalue: '',
                                newvalue: data.code || ''
                            };
                            log.push(item);
                            await CustomerLog.CreateLog(data.mainCustomer._id, 'booking', log, 'completed', req.username);
                        }
                        //#endregion
                        successCount++;
                    }
                    else{
                        errorCount++;
                        continue;
                    }
                }

                return res.status(200).json({ success: true, successCount: successCount, errorCount: errorCount });
            }
            else{
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    cancelBooking: async(req, res) => {
        try{
            var formData = req.body;
            var successCount = 0;
            var errorCount = 0;
            if(formData.cancelReason == null || formData.cancelReason == ''){
                return res.status(200).json({ success: false, error: "Hãy nhập lý do hủy" });
            }
            if(formData.ids && formData.ids.length > 0){
                for(var i = 0; i < formData.ids.length; i++){
                    const updated = await Appointment.updateOne(
                        { 
                            $and: [
                                { _id: mongoose.Types.ObjectId(formData.ids[i]) },
                                { $or: [
                                        { status: 'new' },
                                        { status: 'arrived' }
                                    ] 
                                }
                            ]
                        },
                        {
                            $set: {
                                status: 'cancelled',
                                cancelReason: formData.cancelReason,
                                cancelledAt: Date.now(),
                                cancelledBy: req.username,
                                updatedAt: Date.now(),
                                updatedBy: req.username
                            }
                        }
                    );
                    if(updated.modifiedCount > 0 && updated.acknowledged == true){
                        var data = await Appointment.findById(formData.ids[i]);
                        //#region Gửi email thông báo KH
                        if(data.mainCustomer && !IsNullOrEmpty(data.mainCustomer.email)){
                            const NOTIFY_CANCEL_APPOINTMENT = await AppointmentConfigs.findOne({ key: 'NOTIFY_CANCEL_APPOINTMENT' });
                            if(NOTIFY_CANCEL_APPOINTMENT && NOTIFY_CANCEL_APPOINTMENT.value == 'yes'){
                                var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/NotifyCancelAppointmentTemplate.html'),{encoding:'utf-8'});
                                if(template){
                                    template = template.replace(/{customerName}/g, data.mainCustomer != null ? data.mainCustomer?.name : '');
                                    template = template.replace(/{cancelReason}/g, formData.cancelReason);
                    
                                    var timeRemind = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
                                    var expireTime = moment(timeRemind).add(10, 's')._d;
                                    var dateCronRemind = convertDateToCron(expireTime);
                    
                                    var job2 = await new CronJob(
                                        dateCronRemind,
                                        async function(){
                                            await sendMail({ to: data.mainCustomer?.email, subject: 'HỦY LỊCH HẸN', body: template });
                                        },
                                        null,
                                        true,
                                        'Asia/Ho_Chi_Minh'
                                    );
                                    await job2.start();
                                }
                            }
                        }
                        //#endregion

                        //Logs
                        var log = [];
                        var item = {
                            column: 'Lý do',
                            oldvalue: '',
                            newvalue: formData.cancelReason || ''
                        };
                        log.push(item);
                        await AppointmentLog.CreateLog(data._id, 'Hủy lịch hẹn', log, req.username);

                        //#region Log khách hàng
                        if(data){
                            var log = [];
                            var item = {
                                column: 'Hủy lịch hẹn',
                                oldvalue: '',
                                newvalue: data.code || ''
                            };
                            log.push(item);
                            await CustomerLog.CreateLog(data.mainCustomer._id, 'booking', log, 'cancel', req.username);
                        }
                        //#endregion
                        successCount++;
                    }
                    else{
                        errorCount++;
                        continue;
                    }
                }

                return res.status(200).json({ success: true, successCount: successCount, errorCount: errorCount });
            }
            else{
                return res.status(200).json({ success: false, error: "Có lỗi xảy ra" });
            }
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
    getWorkingCalendar: async(req, res) => {
        try{
            var filters = req.body;
            var data = await Appointment.aggregate([
                { $lookup: {
                    from: "tw_users",
                    localField: "dentistId",
                    foreignField: "_id",
                    as: "dentistInfo"
                }},
                {
                    $addFields: {
                        "dentistName": { $arrayElemAt: ["$dentistInfo.name", 0] },
                        "dentistUsername": { $arrayElemAt: ["$dentistInfo.username", 0] },
                        "dentistPhone": { $arrayElemAt: ["$dentistInfo.phone", 0] },
                        "dentistCode": { $arrayElemAt: ["$dentistInfo.code", 0] }
                    }
                },
                { $project: { 
                    dentistInfo: 0
                }},
                { $match: { 
                    $and: [
                        { dentistUsername: req.username },
                        filters.dateF ? { 
                            dateTimeFrom: { $gte: new Date(new Date(`${filters.dateF}`).setHours(0,0,0,0)) }
                        } : {},
                        filters.dateF ? { 
                            dateTimeFrom: { $lte: new Date(new Date(`${filters.dateF}`).setHours(23,59,0,0)) }
                        } : {},
                        (filters.statusF.length > 0 && filters.statusF != null) ? { 
                            status: { $in: filters.statusF }
                        } : {}
                    ]
                }}
            ]);

            return res.status(200).json({ success: true, data: data });
        }
        catch(err){
            return res.status(400).json({ success: false, error: err });
        }
    },
}

module.exports = AppointmentBookingController;