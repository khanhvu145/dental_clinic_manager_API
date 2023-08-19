const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const tw_PaymentSlip = new Schema({
    code: { 
        type: String, 
    },
    date: {
        type: Date,
    },
    amount: { 
        type: Schema.Types.Number,  
        default: 0
    },
    content: {
        type: String,
        required: true,
    },
    status: {
        type: String,
    },
    type: {
        type: String,
    },
    note: {
        type: String,
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

tw_PaymentSlip.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

//Tạo phiếu chi
tw_PaymentSlip.statics.createPaymentSlip = async function(data){
    try{
        const _this = this;
        
        const newPayment = await new  _this({
            amount: data.amount ? parseFloat(data.amount) : parseFloat(0),
            content: data.content,
            status: data.status,
            type: data.type,
            createdAt: Date.now(),
            createdBy: data.createdBy
        }).save();
        
        await _this.updateOne(
            { _id: newPayment._id }, 
            {
                $set: { 
                    code: 'PC' + newPayment._id.toString().slice(-5).toUpperCase()
                }
            }
        );
        
        var newData = await _this.findById(newPayment.id);

        if(newData == null || newData.length <= 0){
            return { code: -1, error: 'Có lỗi xảy ra khi tạo phiếu chi', data: {} };
        }
        
        return { code: 1, error: '', data: newData };
    }
    catch(err){
        console.log(err);
        return { code: 0, error: err, data: {} };
    }
};

module.exports = mongoose.model('tw_PaymentSlip', tw_PaymentSlip);