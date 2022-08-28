const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_User = new Schema({
    code: { 
        type: String, 
    },
    username: { 
        type: String,
        unique: true, 
        required: true 
    },
    password: { 
        type: String, 
        required: true
    },
    name: { 
        type: String, 
        required: true 
    },
    physicalId: { 
        type: String, 
        required: true 
    },
    dateOfIssue: { 
        type: Date,
    },
    placeOfIssue: { 
        type: String,
    },
    email: { 
        type: String
    },
    phone: { 
        type: String,
        required: true 
    },
    birthday: { 
        type: Date,
    },
    gender: { 
        type: String,
    },
    address: { 
        type: Object,
        properties: { 
            building: { type: String },
            wardId: { type: Schema.Types.Decimal128, default: 0 },
            districtId: { type: Schema.Types.Decimal128, default: 0 },
            provinceId: { type: Schema.Types.Decimal128, default: 0 },
        }
    },
    img: {
        type: String,
    },
    imageFile: {
        type: Object,
        default: null
    },
    accessId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_AccessGroup"
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

tw_User.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('tw_User', tw_User);