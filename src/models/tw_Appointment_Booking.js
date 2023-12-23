const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;
const moment = require('moment');
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const AppointmentConfigs = require('../models/tw_Appointment_Config');
const Notification = require('../models/tw_Notification');
const User = require('../models/tw_User');
const GeneralConfig = require('../models/tw_GeneralConfig');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const isObjectId = require('../helpers/isObjectId');
const sendMail = require('../helpers/sendMail');
const convertDateToCron = require('../helpers/convertDateToCron');
const CronJob = require('cron').CronJob;
const path = require('path');
const fs = require('fs');

const tw_Appointment_Booking = new Schema({
    code: {
        type: String,
    },
    dentistId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_User"
    },
    mainCustomer:{
        type: Object,
        required: true,
        properties: { 
            _id: { type: Schema.Types.ObjectId },
            code: { type: String },
            name: { type: String },
            physicalId: { type: String },
            dateOfIssue: { type: Date },
            placeOfIssue: { type: String },
            email: { type: String },
            phone: { type: String },
            birthday: { type: Date },
            gender: { type: String },
            fullAddress: { type: String },
        }
    },
    date: {
        type: Date,
        required: true,
    },
    timeFrom: {
        type: String,
        required: true,
    },
    timeTo: {
        type: String,
        required: true,
    },
    session: {
        type: String,
        required: true,
    },
    type: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "tw_GeneralConfig"
    },
    content: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "tw_GeneralConfig"
    },
    note: {
        type: String,
    },
    status: {
        type: String,
        required: true
    },
    dateTimeFrom: {
        type: Date,
    },
    dateTimeTo: {
        type: Date,
    },
    createdAt: {
        type: Date,
    },
    createdBy: {
        type: String,
    },
    updatedAt: {
        type: Date,
    },
    updatedBy: {
        type: String,
    },
    jobAutoRemindId: {
        type: String,
    },
    confirmAt: {
        type: Date,
    },
    confirmBy: {
        type: String,
    },
    completedAt: {
        type: Date,
    },
    completedBy: {
        type: String,
    },
    cancelledAt: {
        type: Date,
    },
    cancelledBy: {
        type: String,
    },
    cancelReason: {
        type: String,
    },
});

tw_Appointment_Booking.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

tw_Appointment_Booking.statics.checkCanBook = async function(data, isUpdate){
    var currentDate = new Date();
    var timeFrom = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + data.timeFrom);
    var timeTo = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + data.timeTo);

    if(moment(timeFrom).isBefore(currentDate) || moment(timeTo).isBefore(currentDate)){
        /**Thời gian đặt hẹn không hợp lệ */
        return -1;
    }

    if(moment(timeTo).isSameOrBefore(timeFrom)){
        /**Khoảng thời gian không hợp lệ */
        return -2;
    }

    var listAppointment = await this.find({ 
        $and: [
            { dentistId: { $eq: data.dentistId } },
            { status: { $ne: 'cancelled' } },
            { date: { $eq: data.date } },
            isUpdate == true ? { _id: { $ne: data._id } } : {}
        ]
    });

    if(listAppointment.length > 0){
        var dem = 0;
        for(var i = 0; i < listAppointment.length; i++){
            if(
                moment(timeFrom).isBetween(listAppointment[i].dateTimeFrom, listAppointment[i].dateTimeTo, undefined, '[)') ||
                moment(timeTo).isBetween(listAppointment[i].dateTimeFrom, listAppointment[i].dateTimeTo, undefined, '(]') ||
                moment(listAppointment[i].dateTimeFrom).isBetween(timeFrom, timeTo, undefined, '[)') ||
                moment(listAppointment[i].dateTimeTo).isBetween(timeFrom, timeTo, undefined, '(]')
            ){
                break;
            }

            dem++;
        }

        if(dem < listAppointment.length){
            /**Thời gian đặt hẹn bị trùng */
            return -3;
        }
    }

    //Kiểm tra thời gian so với thời gian cấu hình lịch hẹn
    const WORKING_TIME_MORNING_START = await AppointmentConfigs.findOne({ key: 'WORKING_TIME_MORNING_START' });
    const WORKING_TIME_MORNING_END = await AppointmentConfigs.findOne({ key: 'WORKING_TIME_MORNING_END' });
    const WORKING_TIME_AFTERNOON_START = await AppointmentConfigs.findOne({ key: 'WORKING_TIME_AFTERNOON_START' });
    const WORKING_TIME_AFTERNOON_END = await AppointmentConfigs.findOne({ key: 'WORKING_TIME_AFTERNOON_END' });
    const WORKING_TIME_DAY_OF_WEEK = await AppointmentConfigs.findOne({ key: 'WORKING_TIME_DAY_OF_WEEK' });
    if(WORKING_TIME_MORNING_START && WORKING_TIME_MORNING_END && WORKING_TIME_AFTERNOON_START && WORKING_TIME_AFTERNOON_END && WORKING_TIME_DAY_OF_WEEK){
        var workingDayConfigs = JSON.parse(WORKING_TIME_DAY_OF_WEEK.value);
        var workingDayConfig = workingDayConfigs.find(item => {
            return item.key == moment(data.date).day();
        });
        if(workingDayConfig){
            //Kiểm tra trạng thái áp dụng
            if(workingDayConfig.active == false){
                //Ngày hẹn ngoài giờ làm việc
                return -4;
            }
            if(data.session == 'morning'){
                if(!workingDayConfig.session.includes('morning')){
                    //Ngày hẹn ngoài giờ làm việc
                    return -4;
                }
                var timeFromConfig = moment(data.date).format('YYYY-MM-DD') + ' ' + WORKING_TIME_MORNING_START.value;
                var timeToConfig = moment(data.date).format('YYYY-MM-DD') + ' ' + WORKING_TIME_MORNING_END.value;
                if(
                    !moment(timeFrom).isBetween(timeFromConfig, timeToConfig, undefined, '[)') ||
                    !moment(timeTo).isBetween(timeFromConfig, timeToConfig, undefined, '(]')
                ){
                    //Ngày hẹn ngoài giờ làm việc
                    return -4;
                }
            }
            if(data.session == 'afternoon'){
                if(!workingDayConfig.session.includes('afternoon')){
                    //Ngày hẹn ngoài giờ làm việc
                    return -4;
                }
                var timeFromConfig = moment(data.date).format('YYYY-MM-DD') + ' ' + WORKING_TIME_AFTERNOON_START.value;
                var timeToConfig = moment(data.date).format('YYYY-MM-DD') + ' ' + WORKING_TIME_AFTERNOON_END.value;
                if(
                    !moment(timeFrom).isBetween(timeFromConfig, timeToConfig, undefined, '[)') ||
                    !moment(timeTo).isBetween(timeFromConfig, timeToConfig, undefined, '(]')
                ){
                    //Ngày hẹn ngoài giờ làm việc
                    return -4;
                }
            }
        }
    }

    return 1;
}

tw_Appointment_Booking.statics.createBooking = async function(formData, username){
    try{
        const _this = this;
        //#region Lưu thông tin booking
        const newAppointment = await new _this({
            dentistId: formData.dentistId, 
            date: formData.date, 
            timeFrom: formData.timeFrom, 
            timeTo: formData.timeTo, 
            dateTimeFrom: new Date(moment(formData.date).format('YYYY/MM/DD') + ' ' + formData.timeFrom), 
            dateTimeTo: new Date(moment(formData.date).format('YYYY/MM/DD') + ' ' + formData.timeTo), 
            session: formData.session, 
            type: formData.type, 
            content: formData.content, 
            note: formData.note, 
            status: 'new',
            mainCustomer: formData.mainCustomer, 
            createdAt: Date.now(),
            createdBy: username,
        }).save();
        await _this.updateOne(
            { _id: newAppointment._id }, 
            {
                $set: { 
                    code: `APM/${moment().format('MMYYYY')}/${newAppointment._id.toString().slice(-5).toUpperCase()}`
                }
            }
        );
        var data = await _this.findById(newAppointment._id);
        //#endregion

        if(data){
            //#region Nhắc hẹn tự động
            // Lấy các cấu hình
            const AUTO_REMIND_APPLY = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_APPLY' });
            const AUTO_REMIND_DURATION = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_DURATION' });
            const AUTO_REMIND_DURATION_TYPE = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_DURATION_TYPE' });
            const AUTO_REMIND_TIME = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_TIME' });
            const AUTO_REMIND_TYPE = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_TYPE' });
            if(AUTO_REMIND_APPLY && AUTO_REMIND_DURATION && AUTO_REMIND_DURATION_TYPE && AUTO_REMIND_TIME && AUTO_REMIND_TYPE){
                if(AUTO_REMIND_APPLY.value == 'on') {
                    var expireTime = null;
                    if(AUTO_REMIND_DURATION_TYPE.value == 'day'){
                        var timeAutoRemind = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + AUTO_REMIND_TIME.value);
                        expireTime = moment(timeAutoRemind).subtract(AUTO_REMIND_DURATION.value, 'd')._d;
                    }
                    else if(AUTO_REMIND_DURATION_TYPE.value == 'hour'){
                        var timeAutoRemind = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + data.timeFrom);
                        expireTime = moment(timeAutoRemind).subtract(AUTO_REMIND_DURATION.value, 'h')._d;
                    }
                    else if(AUTO_REMIND_DURATION_TYPE.value == 'minute'){
                        var timeAutoRemind = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + data.timeFrom);
                        expireTime = moment(timeAutoRemind).subtract(AUTO_REMIND_DURATION.value, 'm')._d;
                    }

                    if(expireTime != null){
                        var dateCronAutoRemind = convertDateToCron(expireTime);
                        var jobId = `${moment().format('DDMMYYHHmmss')}-${moment(expireTime).format('DDMMYYHHmmss')}-${data._id}`;
                        var job = await new CronJob(
                            dateCronAutoRemind,
                            async function(){
                                if(AUTO_REMIND_TYPE.value == 'email' || AUTO_REMIND_TYPE.value == 'smsEmail'){
                                    await _this.sendMailAutoRemindBooking(data._id, jobId);
                                }
                            },
                            null,
                            true,
                            'Asia/Ho_Chi_Minh'
                        );
                        await _this.updateOne(
                            { _id: data._id }, 
                            {
                                $set: { 
                                    jobAutoRemindId: jobId
                                }
                            }
                        );
                        await job.start();
                    }
                }
            }
            //#endregion

            //#region Gửi email thông báo KH
            if(data.mainCustomer && !IsNullOrEmpty(data.mainCustomer.email)){
                const NOTIFY_CREATE_APPOINTMENT = await AppointmentConfigs.findOne({ key: 'NOTIFY_CREATE_APPOINTMENT' });
                if(NOTIFY_CREATE_APPOINTMENT && NOTIFY_CREATE_APPOINTMENT.value == 'yes'){
                    var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/NotifyCreateAppointmentTemplate.html'),{encoding:'utf-8'});
                    if(template){
                        var dentistInfo =  await User.findById(data.dentistId);
                        var contentInfo =  await GeneralConfig.findById(data.content); 
                        template = template.replace(/{customerName}/g, data.mainCustomer != null ? data.mainCustomer?.name : '');
                        template = template.replace(/{customerPhone}/g, data.mainCustomer != null ? data.mainCustomer?.phone : '');
                        template = template.replace(/{customerPhysicalId}/g, data.mainCustomer != null ? data.mainCustomer?.physicalId : '');
                        template = template.replace(/{code}/g, data.code);
                        template = template.replace(/{date}/g, moment(data.date).format('DD/MM/YYYY').toString());
                        template = template.replace(/{time}/g, `${data.timeFrom} - ${data.timeTo}`);
                        template = template.replace(/{dentistName}/g, dentistInfo != null ? dentistInfo?.name : '');
                        template = template.replace(/{content}/g, contentInfo != null ? contentInfo?.value : '');
        
                        var timeRemind = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
                        var expireTime = moment(timeRemind).add(10, 's')._d;
                        var dateCronRemind = convertDateToCron(expireTime);
        
                        var job2 = await new CronJob(
                            dateCronRemind,
                            async function(){
                                await sendMail({ to: data.mainCustomer?.email, subject: 'ĐẶT HẸN THÀNH CÔNG', body: template });
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

            //#region Log
            var log = [];
            var isUpdate = false;
            if(isObjectId(data.dentistId)){
                const UserData = await User.findById(data.dentistId);
                isUpdate = true;
                var item = {
                    column: 'Nha sĩ phụ trách',
                    oldvalue: '',
                    newvalue: UserData.name || ''
                };
                log.push(item);
            }
            if(data.mainCustomer && !IsNullOrEmpty(data.mainCustomer.name)){
                isUpdate = true;
                var item = {
                    column: 'Khách hàng',
                    oldvalue: '',
                    newvalue: data.mainCustomer.name || ''
                };
                log.push(item);
            }
            if(isObjectId(data.content)) {
                const GeneralConfigData = await GeneralConfig.findById(data.content);
                isUpdate = true;
                var item = {
                    column: 'Nội dung',
                    oldvalue: '',
                    newvalue: GeneralConfigData.value || ''
                };
                log.push(item);
            }
            if(data.date != null) {
                isUpdate = true;
                var item = {
                    column: 'Ngày hẹn',
                    oldvalue: '',
                    newvalue: moment(data.date).format('DD/MM/YYYY')
                };
                log.push(item);
            }
            if(!IsNullOrEmpty(data.timeFrom) && !IsNullOrEmpty(data.timeTo)) {
                isUpdate = true;
                var item = {
                    column: 'Thời gian',
                    oldvalue: '',
                    newvalue: `${data.timeFrom} - ${data.timeTo}`
                };
                log.push(item);
            }
            if(isObjectId(data.type)) {
                const GeneralConfigData = await GeneralConfig.findById(data.type);
                isUpdate = true;
                var item = {
                    column: 'Loại lịch hẹn',
                    oldvalue: '',
                    newvalue: GeneralConfigData.value || ''
                };
                log.push(item);
            }
            if(!IsNullOrEmpty(data.note)) {
                isUpdate = true;
                var item = {
                    column: 'Ghi chú',
                    oldvalue: '',
                    newvalue: data.note
                };
                log.push(item);
            }
            if (isUpdate)
            {
                await AppointmentLogModel.CreateLog(data._id, 'create', log, username);
            }
            //#endregion

            return { code: 1, data: data, error: '' };
        }
        else{
            return { code: -1, data: {}, error: 'Đặt hẹn không thành công' };
        }
    }
    catch(err){
        console.log(err);
        return { code: 0, data: {}, error: err };
    }
};

tw_Appointment_Booking.statics.updateBooking = async function(formData, exist, username){
    try{
        const _this = this;
        const updated = await _this.updateOne(
            { _id: formData._id }, 
            {
                $set: { 
                    dentistId: formData.dentistId, 
                    date: formData.date, 
                    timeFrom: formData.timeFrom, 
                    timeTo: formData.timeTo, 
                    dateTimeFrom: new Date(moment(formData.date).format('YYYY/MM/DD') + ' ' + formData.timeFrom), 
                    dateTimeTo: new Date(moment(formData.date).format('YYYY/MM/DD') + ' ' + formData.timeTo), 
                    session: formData.session, 
                    type: formData.type, 
                    content: formData.content, 
                    note: formData.note, 
                    updatedAt: Date.now(),
                    updatedBy: username
                }
            }
        );
        if(updated.modifiedCount > 0 && updated.acknowledged == true){
            var data = await _this.findById(formData._id);
            if(data){
                //#region Nhắc hẹn tự động
                // Lấy các cấu hình
                const AUTO_REMIND_APPLY = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_APPLY' });
                const AUTO_REMIND_DURATION = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_DURATION' });
                const AUTO_REMIND_DURATION_TYPE = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_DURATION_TYPE' });
                const AUTO_REMIND_TIME = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_TIME' });
                const AUTO_REMIND_TYPE = await AppointmentConfigs.findOne({ key: 'AUTO_REMIND_TYPE' });
                if(AUTO_REMIND_APPLY && AUTO_REMIND_DURATION && AUTO_REMIND_DURATION_TYPE && AUTO_REMIND_TIME && AUTO_REMIND_TYPE){
                    if(AUTO_REMIND_APPLY.value == 'on') {
                        var expireTime = null;
                        if(AUTO_REMIND_DURATION_TYPE.value == 'day'){
                            var timeAutoRemind = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + AUTO_REMIND_TIME.value);
                            expireTime = moment(timeAutoRemind).subtract(AUTO_REMIND_DURATION.value, 'd')._d;
                        }
                        else if(AUTO_REMIND_DURATION_TYPE.value == 'hour'){
                            var timeAutoRemind = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + data.timeFrom);
                            expireTime = moment(timeAutoRemind).subtract(AUTO_REMIND_DURATION.value, 'h')._d;
                        }
                        else if(AUTO_REMIND_DURATION_TYPE.value == 'minute'){
                            var timeAutoRemind = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + data.timeFrom);
                            expireTime = moment(timeAutoRemind).subtract(AUTO_REMIND_DURATION.value, 'm')._d;
                        }

                        if(expireTime != null){
                            var dateCronAutoRemind = convertDateToCron(expireTime);
                            var jobId = `${moment().format('DDMMYYHHmmss')}-${moment(expireTime).format('DDMMYYHHmmss')}-${data._id}`;
                            var job = await new CronJob(
                                dateCronAutoRemind,
                                async function(){
                                    if(AUTO_REMIND_TYPE.value == 'email' || AUTO_REMIND_TYPE.value == 'smsEmail'){
                                        await _this.sendMailAutoRemindBooking(data._id, jobId);
                                    }
                                },
                                null,
                                true,
                                'Asia/Ho_Chi_Minh'
                            );
                            await _this.updateOne(
                                { _id: data._id }, 
                                {
                                    $set: { 
                                        jobAutoRemindId: jobId
                                    }
                                }
                            );
                            await job.start();
                        }
                    }
                }
                //#endregion

                //#region Gửi email thông báo KH
                if(
                    moment(data.dateTimeFrom).format('YYYY/MM/DD HH:mm') != moment(exist.dateTimeFrom).format('YYYY/MM/DD HH:mm') ||
                    moment(data.dateTimeTo).format('YYYY/MM/DD HH:mm') != moment(exist.dateTimeTo).format('YYYY/MM/DD HH:mm')
                ){
                    if(data.mainCustomer && !IsNullOrEmpty(data.mainCustomer.email)){
                        const NOTIFY_UPDATE_APPOINTMENT = await AppointmentConfigs.findOne({ key: 'NOTIFY_UPDATE_APPOINTMENT' });
                        if(NOTIFY_UPDATE_APPOINTMENT && NOTIFY_UPDATE_APPOINTMENT.value == 'yes'){
                            var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/NotifyUpdateAppointmentTemplate.html'),{encoding:'utf-8'});
                            if(template){
                                var dentistInfo =  await User.findById(data.dentistId);
                                var contentInfo =  await GeneralConfig.findById(data.content); 
                                template = template.replace(/{customerName}/g, data.mainCustomer != null ? data.mainCustomer?.name : '');
                                template = template.replace(/{customerPhone}/g, data.mainCustomer != null ? data.mainCustomer?.phone : '');
                                template = template.replace(/{customerPhysicalId}/g, data.mainCustomer != null ? data.mainCustomer?.physicalId : '');
                                template = template.replace(/{code}/g, data.code);
                                template = template.replace(/{date}/g, moment(data.date).format('DD/MM/YYYY').toString());
                                template = template.replace(/{time}/g, `${data.timeFrom} - ${data.timeTo}`);
                                template = template.replace(/{dentistName}/g, dentistInfo != null ? dentistInfo?.name : '');
                                template = template.replace(/{content}/g, contentInfo != null ? contentInfo?.value : '');
                
                                var timeRemind = new Date(moment().format('YYYY/MM/DD HH:mm:ss'));
                                var expireTime = moment(timeRemind).add(10, 's')._d;
                                var dateCronRemind = convertDateToCron(expireTime);
                
                                var job2 = await new CronJob(
                                    dateCronRemind,
                                    async function(){
                                        await sendMail({ to: data.mainCustomer?.email, subject: 'CẬP NHẬT THỜI GIAN LỊCH HẸN', body: template });
                                    },
                                    null,
                                    true,
                                    'Asia/Ho_Chi_Minh'
                                );
                                await job2.start();
                            }
                        }
                    }
                }
                //#endregion

                //#region Log
                var log = [];
                var isUpdate = false;
                if(!exist.dentistId.equals(data.dentistId)){
                    const newValue = await User.findById(data.dentistId);
                    const oldValue = await User.findById(exist.dentistId);
                    isUpdate = true;
                    var item = {
                        column: 'Nha sĩ phụ trách',
                        oldvalue: oldValue.name || '',
                        newvalue: newValue.name || ''
                    };
                    log.push(item);
                }
                if(moment(data.date).format('YYYY/MM/DD') != moment(exist.date).format('YYYY/MM/DD')){
                    isUpdate = true;
                    var item = {
                        column: 'Ngày hẹn',
                        oldvalue: moment(exist.date).format('DD/MM/YYYY'),
                        newvalue: moment(data.date).format('DD/MM/YYYY')
                    };
                    log.push(item);
                }
                if(data.timeFrom != exist.timeFrom || data.timeTo != exist.timeTo){
                    isUpdate = true;
                    var item = {
                        column: 'Thời gian',
                        oldvalue: `${exist.timeFrom} - ${exist.timeTo}`,
                        newvalue: `${data.timeFrom} - ${data.timeTo}`
                    };
                    log.push(item);
                }
                if(!exist.content.equals(data.content)){
                    const GeneralConfigData = await GeneralConfig.find({
                        $and: [
                            { type: { $regex: 'appointment_content', $options:"i" } }
                        ]
                    });
                    isUpdate = true;
                    var item = {
                        column: 'Nội dung',
                        oldvalue: GeneralConfigData.find(x => x._id.equals(exist.content)) ? GeneralConfigData.find(x => x._id.equals(exist.content)).value : '',
                        newvalue: GeneralConfigData.find(x => x._id.equals(data.content)) ? GeneralConfigData.find(x => x._id.equals(data.content)).value : ''
                    };
                    log.push(item);
                }
                if(!exist.type.equals(data.type)){
                    const GeneralConfigData = await GeneralConfig.find({
                        $and: [
                            { type: { $regex: 'appointment_type', $options:"i" } }
                        ]
                    });
                    isUpdate = true;
                    var item = {
                        column: 'Loại lịch hẹn',
                        oldvalue: GeneralConfigData.find(x => x._id.equals(exist.type)) ? GeneralConfigData.find(x => x._id.equals(exist.type)).value : '',
                        newvalue: GeneralConfigData.find(x => x._id.equals(data.type)) ? GeneralConfigData.find(x => x._id.equals(data.type)).value : ''
                    };
                    log.push(item);
                }
                if(exist.note != data.note) {
                    isUpdate = true;
                    var item = {
                        column: 'Ghi chú',
                        oldvalue: exist.note,
                        newvalue: data.note
                    };
                    log.push(item);
                }
                if (isUpdate)
                {
                    await AppointmentLogModel.CreateLog(data._id, 'update', log, username);
                }
                //#endregion

                return { code: 1, data: data, error: '' };
            }
        }
        else{
            return { code: -1, data: {}, error: 'Chỉnh sửa lịch hẹn không thành công' };
        }
    }
    catch(err){
        console.log(err);
        return { code: 0, data: {}, error: err };
    }
};

tw_Appointment_Booking.statics.sendMailAutoRemindBooking = async function(id, jobId) {
    try{
        var existBooking = await this.findById(id);
        if(existBooking == null) return;
        if(existBooking.status != 'new') return;
        if(existBooking.mainCustomer == null) return;
        if(existBooking.jobAutoRemindId != jobId) return;
    
        var dentistInfo =  await User.findById(existBooking.dentistId);
        var contentInfo =  await GeneralConfig.findById(existBooking.content);
    
        var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/RemindEmailTemplate.html'),{encoding:'utf-8'});  
    
        //#region Replace value
        template = template.replace(/{customerName}/g, existBooking.mainCustomer != null ? existBooking.mainCustomer.name : '');
        template = template.replace(/{code}/g, existBooking.code);
        template = template.replace(/{date}/g, moment(existBooking.date).format('DD/MM/YYYY').toString());
        template = template.replace(/{time}/g, `${existBooking.timeFrom} - ${existBooking.timeTo}`);
        template = template.replace(/{dentistName}/g, dentistInfo != null ? dentistInfo.name : '');
        template = template.replace(/{content}/g, contentInfo != null ? contentInfo.value : '');
    
        if(existBooking.mainCustomer != null && !IsNullOrEmpty(existBooking.mainCustomer.email)) {
            await sendMail({ to: existBooking.mainCustomer.email, subject: 'THƯ NHẮC HẸN', body: template });
            //#region log
            var log = [];
            var item = {
                column: 'Gửi lúc',
                oldvalue: '',
                newvalue: moment().format('DD/MM/YYYY hh:mm')
            };
            log.push(item);
            await AppointmentLog.CreateLog(existBooking._id, 'Gửi nhắc hẹn tự động', log, 'system');
            //#endregion
        }
        //#endregion
    }
    catch(err){
        console.log(err);
        return;
    }
}

/**Appointment log */
const tw_Appointment_Booking_Log = new Schema({
    appointmentId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_Appointment"
    },
    type: {
        type: String,
    },
    note: {
        type: Array,
    },
    createdAt: {
        type: Date,
    },
    createdBy: {
        type: String,
    }
});

tw_Appointment_Booking_Log.statics.CreateLog = async function (appointmentId, type, note, currentUser){
    var log = {};
    log.appointmentId = appointmentId;
    log.type = type;
    log.note = note;
    log.createdBy = currentUser ? currentUser : 'System';
    log.createdAt = Date.now();
    await this.create(log, function(err, result){
        if(err) {
            return false;
        }
        else{
            return true;
        }
    });
};

const AppointmentModel = mongoose.model('tw_Appointment_Booking', tw_Appointment_Booking);
const AppointmentLogModel = mongoose.model('tw_Appointment_Booking_Log', tw_Appointment_Booking_Log);

module.exports = {
    AppointmentModel,
    AppointmentLogModel
}