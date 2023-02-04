const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;
const moment = require('moment');
const Customer = require('../models/tw_Customer');
const AppointmentConfig = require('../models/tw_AppointmentConfig');

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

tw_Appointment.statics.checkCanBook = async function(data) {
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

tw_Appointment.statics.cronCancelBooking = async function(id, cancelReason) {
    const exist = await this.findById(id);
    if(exist == null) return;

    if(exist.status == "Chưa đến") {
        return await this.updateOne(
            { _id: exist._id }, 
            {
                $set: { 
                    isActive: false,
                    cancelReason: cancelReason,
                    cancelledAt: Date.now(),
                }
            }
        );
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
