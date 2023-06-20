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
    attachFiles: { 
        type: Array,
    },
    diagnosisTreatment: { 
        type: Array,
        required: true,
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

tw_Examination.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_Examination', tw_Examination);