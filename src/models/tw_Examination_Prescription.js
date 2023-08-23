const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Examination_Prescription = new Schema({
    examinationId: { 
        type: Schema.Types.ObjectId, 
        required: true,
    },
    // customerId: { 
    //     type: Schema.Types.ObjectId, 
    //     required: true,
    // },
    advice: {
        type: String,
    },
    medicines: {
        type: [
            {
                order: { type: Number },
                medicine: { type: String },
                quantity: { type: Number },
                note: { type: String },
            }
        ],
        default: []
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

tw_Examination_Prescription.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_Examination_Prescription', tw_Examination_Prescription);