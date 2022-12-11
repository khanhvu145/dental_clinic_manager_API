const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;
const moment = require('moment');

const tw_Appointment = new Schema({
    dentistId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_User"
    },
    customerId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_Customer"
    },
    serviceGroupId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_ServiceGroup"
    },
    timeFrom: {
        type: Date,
        required: true,
    },
    timeTo: {
        type: Date,
        required: true,
    },
    type: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "tw_GeneralConfig"
    },
    status: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "tw_GeneralConfig"
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
    }
});


tw_Appointment.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

tw_Appointment.statics.checkCanBook = async function(data) {
    var currentDate = moment();
    if(moment(data.timeFrom).isBefore(currentDate) || moment(data.timeTo).isBefore(currentDate)){
        /**Thời gian đặt hẹn không hợp lệ */
        return -1;
    }

    if(moment(data.timeTo).isSameOrBefore(data.timeFrom)){
        /**Thời gian kết thúc phải sau thời gian bắt đầu */
        return -2;
    }

    var dateAppointment = moment(data.timeFrom).format('DD/MM/YYYY');
    var dateFromDB = new Date(dateAppointment + ' 00:00:00');
    var dateToDB = new Date(dateAppointment + ' 23:59:59');
    var listAppointment = await this.find({ 
        $and: [
            { dentistId: { $eq: data.dentistId } },
            { timeFrom: { $gte: dateFromDB } },
            { timeFrom: { $lte: dateToDB } },
        ]
    });

    if(listAppointment.length > 0){
        var dem = 0;
        for(var i = 0; i < listAppointment.length; i++){
            if(
                moment(data.timeFrom).isBetween(listAppointment[i].timeFrom, listAppointment[i].timeTo, undefined, '[)') ||
                moment(data.timeTo).isBetween(listAppointment[i].timeFrom, listAppointment[i].timeTo, undefined, '(]') ||
                moment(listAppointment[i].timeFrom).isBetween(data.timeFrom, data.timeTo, undefined, '[)') ||
                moment(listAppointment[i].timeTo).isBetween(data.timeFrom, data.timeTo, undefined, '(]')
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

    return 1;
};

module.exports = mongoose.model('tw_Appointment', tw_Appointment);
