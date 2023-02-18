const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_SMTPConfig = new Schema({
    name: {
        type: String,
        required: true 
    },
    password: { 
        type: String, 
        required: true
    },
    email: { 
        type: String,     
        required: true 
    },
    host: {
        type: String,
        required: true 
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

tw_SMTPConfig.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_SMTPConfig', tw_SMTPConfig);