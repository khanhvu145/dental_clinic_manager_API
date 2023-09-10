const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Customer = new Schema({
    code: { 
        type: String, 
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
    fullAddress: { 
        type: String,
    },
    img: {
        type: String,
    },
    imageFile: {
        type: Object,
        default: null
    },
    customerGroup: {
        type: String,
    },
    source: {
        type: String,
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
    },
    recentActivity: {
        type: Date,
    },
});

tw_Customer.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

const tw_Customer_Log = new Schema({
    customerId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_Customer"
    },
    type: {
        type: String,
        required: true,
    },
    note: {
        type: Array,
    },
    action: {
        type: String,
    },
    createdAt: {
        type: Date,
    },
    createdBy: {
        type: String,
    }
});

tw_Customer_Log.statics.CreateLog = async function (customerId, type, note, action, currentUser){
    var log = {};
    log.customerId = customerId;
    log.type = type;
    log.note = note;
    log.action = action;
    log.createdBy = currentUser ? currentUser : 'System';
    log.createdAt = Date.now();
    await this.create(log, function(err, result){
        if(err) {
            console.log(err)
            return false;
        }
        else{
            return true;
        }
    });
};

const CustomerModel = mongoose.model('tw_Customer', tw_Customer);
const CustomerLogModel = mongoose.model('tw_Customer_Log', tw_Customer_Log);

module.exports = {
    CustomerModel,
    CustomerLogModel
}

// module.exports = mongoose.model('tw_Customer', tw_Customer);