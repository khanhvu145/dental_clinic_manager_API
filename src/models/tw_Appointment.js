const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;
const moment = require('moment');
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const AppointmentConfig = require('../models/tw_AppointmentConfig');
const ServiceGroup = require('../models/tw_ServiceGroup');
const GeneralConfig = require('../models/tw_GeneralConfig');
const User = require('../models/tw_User');
const convertDateToCron = require('../helpers/convertDateToCron');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const isObjectId = require('../helpers/isObjectId');
const sendMail = require('../helpers/sendMail');
const sendSMS = require('../helpers/sendSMS');
const CronJob = require('cron').CronJob;
const path = require('path');
const fs = require('fs');

/** */
const tw_Appointment = new Schema({
    code: {
        type: String,
    },
    dentistId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_User"
    },
    customerId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_customers"
    },
    serviceGroupId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_ServiceGroup"
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    duration: {
        type: Schema.Types.Number,
        required: true,
    },
    durationType: {
        type: String,
        required: true,
    },
    type: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "tw_GeneralConfig"
    },
    status: {
        type: String,
        required: true
    },
    note: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
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
    expireTime: {
        type: Date,
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
    timeFrom: {
        type: Date,
    },
    timeTo: {
        type: Date,
    },
});

tw_Appointment.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

tw_Appointment.statics.booking = async function(formData){
    try{
        /** Xử lý */
        const _this = this;
        var timeFrom = await _this.setTimeFrom(formData.date, formData.time);
        var timeTo = await _this.setTimeTo(timeFrom, parseFloat(formData.duration), formData.durationType);
        const newAppointment = await new _this({
            dentistId: formData.dentistId ? formData.dentistId : '', 
            customerId: formData.customerId ? formData.customerId : '', 
            serviceGroupId: formData.serviceGroupId ? formData.serviceGroupId : '',
            date: formData.date ? formData.date : null,
            time: formData.time ? formData.time : '',
            duration: formData.duration ? parseFloat(formData.duration) : parseFloat(0),
            durationType: formData.durationType ? formData.durationType : 'minutes',
            type: formData.type ? formData.type : '635dedbba3976c621f4c1d8f',
            status: 'Booked',
            note: formData.note ? formData.note : '', 
            timeFrom: timeFrom ? timeFrom : null, 
            timeTo: timeTo ? timeTo : null, 
            isActive: formData.isActive ? formData.isActive : true,
            createdAt: Date.now(),
            createdBy: formData.createdBy ? formData.createdBy : '',
            // expireTime: expireTime ? expireTime : null
        }).save();

        await _this.updateOne(
            { _id: newAppointment._id }, 
            {
                $set: { 
                    code: 'APM-' + newAppointment._id.toString().slice(-5).toUpperCase()
                }
            }
        );
        var data = await _this.findById(newAppointment._id);

        /**Xử lý hủy hẹn tự động */
        var config = await AppointmentConfig.find({});
        if(config != null && config.length > 0) {
            var configInfo = config[0]; 
            if(configInfo.other.autoCancelApply){
                var autoCancelDuration = configInfo.other.autoCancelDuration;
                var expireTime = moment(data.timeFrom)._d;
                if(configInfo.other.autoCancelType == 'minutes'){
                    expireTime = moment(data.timeFrom).add(autoCancelDuration, 'm')._d;
                }
                else if (configInfo.other.autoCancelType == 'hours'){
                    expireTime = moment(data.timeFrom).add(autoCancelDuration, 'h')._d;
                }

                if(expireTime != null){
                    const dateCron = convertDateToCron(expireTime);
                    var job = await new CronJob(
                        dateCron,
                        async function() {
                            await _this.cancelBooking(data._id, 'Hủy hẹn tự động do qua thời gian đặt hẹn', formData.createdBy);
                        },
                        null,
                        true,
                        'Asia/Ho_Chi_Minh'
                    );
                    await job.start();
                }
            }
        }

        /**Xử lý nhắc hẹn tự động */
        if(config != null && config.length > 0){
            var configInfo = config[0]; 
            if(configInfo.autoRemind.apply){
                if(configInfo.autoRemind.repeat){
                    var autoRemindDuration = configInfo.autoRemind.duration;
                    var autoRemindTime = configInfo.autoRemind.time;
                    for(var i = autoRemindDuration; i >= 0; i--){
                        var timeAutoRemind = await _this.setTimeFrom(data.date, autoRemindTime);
                        var expireTime = moment(timeAutoRemind).subtract(i, 'd')._d;
                        // var expireTime = moment(Date.now()).add(i, 'm')._d;
                        if(expireTime != null){
                            var dateCronAutoRemind = convertDateToCron(expireTime);
                            var job3 = await new CronJob(
                                dateCronAutoRemind,
                                async function() {
                                    if(configInfo.autoRemind.type == 'type2' || configInfo.autoRemind.type == 'type3'){
                                        await _this.sendMailAutoRemindBooking(data._id);
                                    }
                                    
                                    if(configInfo.autoRemind.type == 'type1' || configInfo.autoRemind.type == 'type3'){
                                        
                                    }
                                },
                                null,
                                true,
                                'Asia/Ho_Chi_Minh'
                            );
                            await job3.start(); 
                        }
                    }
                }
                else{
                    var autoRemindDuration = configInfo.autoRemind.duration;
                    var autoRemindTime = configInfo.autoRemind.time;
                    var timeAutoRemind = await _this.setTimeFrom(data.date, autoRemindTime);
                    var expireTime = moment(timeAutoRemind).subtract(autoRemindDuration, 'd')._d;
                    // var expireTime = moment(Date.now()).add(1, 'm')._d;
                    if(expireTime != null){
                        var dateCronAutoRemind = convertDateToCron(expireTime);
                        var job2 = await new CronJob(
                            dateCronAutoRemind,
                            async function() {
                                if(configInfo.autoRemind.type == 'type2' || configInfo.autoRemind.type == 'type3'){
                                    await _this.sendMailAutoRemindBooking(data._id);
                                }

                                // await sendSMS(['84703260457'], 'SMS nhắc hẹn tự động', 2, '');
                                
                                // if(configInfo.autoRemind.type == 'type1' || configInfo.autoRemind.type == 'type3'){
                                //     await sendSMS('84703260457', 'SMS nhắc hẹn tự động');
                                // }
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
        if(isObjectId(data.customerId)){
            const CustomerData = await Customer.findById(data.customerId);
            isUpdate = true;
            var item = {
                column: 'Khách hàng',
                oldvalue: '',
                newvalue: CustomerData.name || ''
            };
            log.push(item);
        }
        if(isObjectId(data.serviceGroupId)) {
            const ServiceGroupData = await ServiceGroup.findById(data.serviceGroupId);
            isUpdate = true;
            var item = {
                column: 'Loại dịch vụ',
                oldvalue: '',
                newvalue: ServiceGroupData.name
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
        if(!IsNullOrEmpty(data.time)) {
            isUpdate = true;
            var item = {
                column: 'Giờ hẹn',
                oldvalue: '',
                newvalue: data.time
            };
            log.push(item);
        }
        if(data.duration > 0) {
            isUpdate = true;
            var item = {
                column: 'Khoảng thời gian',
                oldvalue: '',
                newvalue: `${data.duration.toString()} ${(data.durationType == 'minutes' ? 'phút' : 'giờ')}`
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
            await AppointmentLogModel.CreateLog(data._id, 'create', log, formData.createdBy);
        }
        //#endregion

        //#region Log khách hàng
        // if(data){
        //     var content = {
        //         code: data.code,
        //     };
        //     await CustomerLog.CreateLog(data.customerId, 'booking', data._id, content, formData.createdBy);
        // }
        //#endregion

        return { code: 1, data: data, error: '' };
    }
    catch(err){
        console.log(err);
        return { code: 0, data: data, error: err };
    }
};

tw_Appointment.statics.checkCanBook = async function(data, isUpdate) {
    var currentDate = new Date();
    var timeFrom = new Date(moment(data.date).format('YYYY/MM/DD') + ' ' + data.time);
    var timeTo = new Date();
    if(data.durationType == 'minutes'){
        timeTo = moment(new Date(timeFrom)).add(data.duration, 'm')._d;
    }
    else if (data.durationType == 'hours'){
        timeTo = moment(new Date(timeFrom)).add(data.duration, 'h')._d;
    }

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
            { status: { $ne: 'Cancelled' } },
            { date: { $eq: data.date } },
            isUpdate ? { _id: { $ne: data._id } } : {}
        ]
    });

    if(listAppointment.length > 0){
        var dem = 0;
        for(var i = 0; i < listAppointment.length; i++){
            if(
                moment(timeFrom).isBetween(listAppointment[i].timeFrom, listAppointment[i].timeTo, undefined, '[)') ||
                moment(timeTo).isBetween(listAppointment[i].timeFrom, listAppointment[i].timeTo, undefined, '(]') ||
                moment(listAppointment[i].timeFrom).isBetween(timeFrom, timeTo, undefined, '[)') ||
                moment(listAppointment[i].timeTo).isBetween(timeFrom, timeTo, undefined, '(]')
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
    var config = await AppointmentConfig.find({});
    if(config != null && config.length > 0) {
        var configInfo = config[0];
        if(configInfo.workingTime.apply){
            var dayOff = configInfo.workingTime.dayOfWeek.filter(item => item.value == false);
            dayOff = dayOff.map(item => item.key);
            var timeAMFrom = configInfo.workingTime.timeAM.timeFrom + ':00';
            var timeAMTo = configInfo.workingTime.timeAM.timeTo + ':00';
            var timePMFrom = configInfo.workingTime.timePM.timeFrom + ':00';
            var timePMTo = configInfo.workingTime.timePM.timeTo + ':00';
            var check = false;
            if(
                (
                    moment(timeFrom).isBetween((moment(timeFrom).format('YYYY-MM-DD') + ' ' + timeAMFrom), (moment(timeFrom).format('YYYY-MM-DD') + ' ' + timeAMTo), undefined, '[)') &&
                    moment(timeTo).isBetween((moment(timeTo).format('YYYY-MM-DD') + ' ' + timeAMFrom), (moment(timeTo).format('YYYY-MM-DD') + ' ' + timeAMTo), undefined, '(]')
                )
                || 
                (
                    moment(timeFrom).isBetween((moment(timeFrom).format('YYYY-MM-DD') + ' ' + timePMFrom), (moment(timeFrom).format('YYYY-MM-DD') + ' ' + timePMTo), undefined, '[)') &&
                    moment(timeTo).isBetween((moment(timeTo).format('YYYY-MM-DD') + ' ' + timePMFrom), (moment(timeTo).format('YYYY-MM-DD') + ' ' + timePMTo), undefined, '(]')
                )
            ){
                check = true;
            }
    
            if(dayOff.includes(moment(timeFrom).day()) == true || dayOff.includes(moment(timeTo).day()) == true || check == false) {
                //Thời gian đặt hẹn nằm ngoài thời gian làm việc
                return -4;
            }
        }
    }

    return 1;
};

tw_Appointment.statics.cancelBooking = async function(id, cancelReason, curUser) {
    const exist = await this.findById(id);
    if(exist == null) return;

    if(exist.status != "Cancelled" && exist.status != "Examined") {
        await this.updateOne(
            { _id: exist._id }, 
            {
                $set: { 
                    cancelReason: cancelReason ? cancelReason : '',
                    status: 'Cancelled',
                    isActive: false,
                    cancelledAt: Date.now(),
                    cancelledBy: curUser ? curUser : 'System',
                    updatedAt: Date.now(),
                    updatedBy: curUser ? curUser : 'System'
                }
            }
        );

        /**Thông báo */

        /**Log */
        var log = [];
        var item = {
            column: 'Lý do',
            oldvalue: '',
            newvalue: cancelReason || ''
        };
        log.push(item);
        await AppointmentLogModel.CreateLog(exist._id, 'cancel', log, curUser);

        return;
    }
    else {
        return;
    }
};

tw_Appointment.statics.sendMailAutoRemindBooking = async function(id) {
    var existBooking = await this.findById(id);
    if(existBooking == null) return;

    var customerInfo =  await Customer.findById(existBooking.customerId);
    var dentistInfo =  await User.findById(existBooking.dentistId);
    var serviceInfo =  await ServiceGroup.findById(existBooking.serviceGroupId);
    if(customerInfo == null || dentistInfo == null || serviceInfo == null) {
        return;
    }

    if(existBooking.status == "Booked"){
        var template = fs.readFileSync(path.join(__dirname, '/../content/emailTemplate/RemindEmailTemplate.html'),{encoding:'utf-8'});  
        template = template.replace('{customerName}', customerInfo != null ? customerInfo.name : '');
        template = template.replace('{code}', existBooking.code);
        template = template.replace('{date}', moment(existBooking.date).format('DD/MM/YYYY').toString());
        template = template.replace('{time}', existBooking.time);
        template = template.replace('{dentistName}', dentistInfo != null ? dentistInfo.name : '');
        template = template.replace('{service}', serviceInfo != null ? serviceInfo.name : '');

        if(customerInfo != null && !IsNullOrEmpty(customerInfo.email)) {
            await sendMail({ to: customerInfo.email, subject: 'THƯ NHẮC HẸN', body: template });
        }
    }
    else {
        return;
    }
};

tw_Appointment.statics.setTimeFrom = async function setTimeFrom(date, time) {
    var timeFrom = new Date(moment(date).format('YYYY/MM/DD') + ' ' + time);
    return timeFrom;
};

tw_Appointment.statics.setTimeTo = async function setTimeTo(timeFrom, duration, durationType) {
    var timeTo = new Date();
    if(durationType == 'minutes'){
        timeTo = moment(new Date(timeFrom)).add(duration, 'm')._d;
    }
    else if (durationType == 'hours'){
        timeTo = moment(new Date(timeFrom)).add(duration, 'h')._d;
    }
    return timeTo;
};
/**Appointment log */
const tw_Appointment_Log = new Schema({
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

tw_Appointment_Log.statics.CreateLog = async function (appointmentId, type, note, currentUser){
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

const AppointmentModel = mongoose.model('tw_Appointment', tw_Appointment);
const AppointmentLogModel = mongoose.model('tw_Appointment_Log', tw_Appointment_Log);

module.exports = {
    AppointmentModel,
    AppointmentLogModel
  }
