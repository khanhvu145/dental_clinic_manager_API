const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Examination_Designation = new Schema({
    examinationId: { 
        type: Schema.Types.ObjectId, 
        required: true,
    },
    type: { 
        type: Schema.Types.ObjectId, 
        required: true,
    },
    description: {
        type: String,
    },
    fileList: {
        type: Array,
        default: [],
    },
    files: {
        type: [
            {
                name: { type: String },
                url: { type: String }
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

tw_Examination_Designation.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_Examination_Designation', tw_Examination_Designation);