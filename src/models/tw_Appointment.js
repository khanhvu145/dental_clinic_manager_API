const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

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
    serviceId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_Service"
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

module.exports = mongoose.model('tw_Appointment', tw_Appointment);