const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_Payment = new Schema({
    examinationId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_examinations"
    },
    customerId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_customers"
    },
    amount: { 
        type: Schema.Types.Number,  
        default: 0
    },
    paidAmount: { 
        type: Schema.Types.Number,  
        default: 0
    },
    remainAmount: { 
        type: Schema.Types.Number,  
        default: 0
    },
    status: {
        type: String,
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

tw_Payment.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

// Tạo thanh toán
tw_Payment.statics.createPayment = async function(data){
    try{
        /**Xử lý */
        const _this = this;
        const newPayment = await new _this({
            examinationId: data.examinationId ? data.examinationId : '',
            customerId: data.customerId ? data.customerId : '',
            amount: data.amount ? parseFloat(data.amount) : parseFloat(0),
            paidAmount: data.paidAmount ? parseFloat(data.paidAmount) : parseFloat(0),
            remainAmount: data.remainAmount ? parseFloat(data.remainAmount) : parseFloat(0),
            status: data.status ? data.status : 'unpaid',
            createdAt: Date.now(),
            createdBy: data.createdBy ? data.createdBy : ''
        }).save();

        return { code: 1, error: '', data: newPayment };
    }
    catch(err){
        console.log(err);
        return { code: 0, error: err, data: {} };
    }
}

module.exports = mongoose.model('tw_Payment', tw_Payment);