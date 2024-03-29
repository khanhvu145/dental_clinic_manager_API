const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Service = new Schema({
    code: {
        type: String,
        required: true 
    },
    name: {
        type: String,
        required: true 
    },
    groupId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_ServiceGroup"
    },
    price: { 
        type: Schema.Types.Number,    
        required: true 
    },
    unit: {
        type: String,
        required: true 
    },
    description: { 
        type: String
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

tw_Service.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_Service', tw_Service);