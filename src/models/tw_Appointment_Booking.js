const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;
const moment = require('moment');
const tw_Customer = require('../models/tw_Customer');
const Customer = tw_Customer.CustomerModel;
const CustomerLog = tw_Customer.CustomerLogModel;
const AppointmentConfigs = require('../models/tw_Appointment_Config');

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
                    code: 'APM' + newAppointment._id.toString().slice(-5).toUpperCase()
                }
            }
        );
        var data = await _this.findById(newAppointment._id);
        //#endregion

        if(data){
            return { code: 1, data: data, error: '' };
        }
        else{
            return { code: -1, data: {}, error: 'Tạo booking không thành công' };
        }
    }
    catch(err){
        console.log(err);
        return { code: 0, data: {}, error: err };
    }
};

const AppointmentModel = mongoose.model('tw_Appointment_Booking', tw_Appointment_Booking);
module.exports = {
    AppointmentModel,
}