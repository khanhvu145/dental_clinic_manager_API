const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_AccessGroup = new Schema({
    name: { 
        type: String,
        required: true 
    },
    note: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    accesses:{
        type: Array,
        required: true
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

tw_AccessGroup.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_AccessGroup', tw_AccessGroup);