const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Prescription_Config = new Schema({
    title: {
        type: String,
        required: true 
    },
    isActive: {
        type: Boolean,
        default: true
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

tw_Prescription_Config.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_Prescription_Config', tw_Prescription_Config);