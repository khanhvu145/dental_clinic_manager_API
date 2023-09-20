const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Examination = new Schema({
    code: { 
        type: String, 
    },
    customerId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_customers"
    },
    dentistId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_users"
    },
    anamnesis: { 
        type: Array,
    },
    allergy: { 
        type: Object,
        properties: { 
            allergies: { type: Array },
            other: { type: String },
        }
    },
    clinicalExam: { 
        type: String, 
    },
    preclinicalExam: { 
        type: Object,
        properties: { 
            xquang: { type: Array },
            test: { type: Array },
            other: { type: String },
        }
    },
    // attachFiles: { 
    //     type: Array,
    //     default: []
    // },
    // diagnosisTreatment: { 
    //     type: Array,
    // },
    diagnosisTreatment: { 
        type: [
            {
                key: { type: Schema.Types.Number },
                toothType: { type: String, required: true, },
                isJaw: { type: Boolean, default: false},
                jaw: { type: Array, default: [] },
                toothList: { type: Array, default: [] },
                diagnose: { type: String, default: '' },
                serviceGroupId: { type: Schema.Types.ObjectId, required: true, },
                serviceId: { type: Schema.Types.ObjectId, required: true, },
                quantity: { type: Schema.Types.Number, default: 0 },
                quantityJaw: { type: Schema.Types.Number, default: 0 },
                unitPrice: { type: Schema.Types.Number, default: 0 },
                discount: { type: Schema.Types.Number, default: 0 },
                totalPrice: { type: Schema.Types.Number, default: 0 },
            }
        ],
        default: []
    },
    treatmentAmount: { 
        type: Schema.Types.Number,  
        default: 0
    },
    totalDiscountAmount: { 
        type: Schema.Types.Number,  
        default: 0
    },
    totalAmount: { 
        type: Schema.Types.Number,  
        default: 0
    },
    note: {
        type: String,
    },
    status: {
        type: String,
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
    cancelReason: {
        type: String,
    },
    cancelledAt: {
        type: Date,
    },
    cancelledBy: {
        type: String,
    }
});

tw_Examination.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_Examination', tw_Examination);