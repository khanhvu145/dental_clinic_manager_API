const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Prescription = new Schema({
    customerId: { 
        type: Schema.Types.ObjectId, 
        required: true,
    },
    dentistId: { 
        type: Schema.Types.ObjectId, 
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    advice: {
        type: String,
    },
    medicines: {
        type: [
            {
                order: { type: Number },
                medicine: { type: String },
                quantity: { type: Number },
                unit: { type: String },
                note: { type: String },
            }
        ],
        default: [],
        required: true,
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

tw_Prescription.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_Prescription', tw_Prescription);