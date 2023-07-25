const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;
const firebaseDB = require('../helpers/firebase');
const uploadFile = require('../helpers/uploadFile');
const getFileUpload = require('../helpers/getFileUpload');
const tw_Customer = require('../models/tw_Customer');
const CustomerLog = tw_Customer.CustomerLogModel;

const tw_Receipts = new Schema({
    code: { 
        type: String, 
    },
    paymentId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "tw_payments"
    },
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
    methodFee: {
        type: String,
        required: true,
    },
    attachFiles: { 
        type: Array,
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

tw_Receipts.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

// Tạo phiếu thu
tw_Receipts.statics.createReceipts = async function(data, files){
    try{
        /**Xử lý */
        const _this = this;
        //Upload files
        data.attachFiles = [];
        if(files != null && files.length > 0){
            for(let i = 0; i < files.length; i++){
                var file = files[i];
                if(file){
                    var fileName = Date.now().toString() + '-' + file.originalname;
                    var path = firebaseDB.bucket.file('receipts/' + data.customerId + '/' + data.paymentId + '/' + fileName);
                    var buffer = file.buffer;
                    var image = await uploadFile(path, buffer);
                    var fileURL = await getFileUpload(path);
                    await data.attachFiles.push(fileURL[0]);
                }
            }
        }
        const newReceipts = await new _this({
            paymentId: data.paymentId ? data.paymentId : '',
            examinationId: data.examinationId ? data.examinationId : '',
            customerId: data.customerId ? data.customerId : '',
            amount: data.amount ? parseFloat(data.amount) : parseFloat(0),
            methodFee: data.methodFee ? data.methodFee : '',
            attachFiles: data.attachFiles || [], 
            note: data.note ? data.note : '',
            createdAt: Date.now(),
            createdBy: data.createdBy ? data.createdBy : ''
        }).save();

        await _this.updateOne(
            { _id: newReceipts._id }, 
            {
                $set: { 
                    code: 'PT' + newReceipts._id.toString().slice(-5).toUpperCase()
                }
            }
        );

        var newData = await _this.aggregate([
            { $lookup: {
                from: "tw_customers",
                localField: "customerId",
                foreignField: "_id",
                as: "customerInfo"
            }},
            { $lookup: {
                from: "tw_examinations",
                localField: "examinationId",
                foreignField: "_id",
                as: "examinationInfo"
            }},
            {
                $addFields: {
                    "customerCode": { $arrayElemAt: ["$customerInfo.code", 0] },
                    "customerName": { $arrayElemAt: ["$customerInfo.name", 0] },
                    "customerBirthday": { $arrayElemAt: ["$customerInfo.birthday", 0] },
                    "customerGender": { $arrayElemAt: ["$customerInfo.gender", 0] },
                    "customerPhysicalId": { $arrayElemAt: ["$customerInfo.physicalId", 0] },
                    "customerPhone": { $arrayElemAt: ["$customerInfo.phone", 0] },
                    "examinationCode": { $arrayElemAt: ["$examinationInfo.code", 0] }
                }
            },
            { $project: { 
                customerInfo: 0,
                examinationInfo: 0
            }},
            { $match: { 
                $and: [
                    { _id: mongoose.Types.ObjectId(newReceipts._id) },
                ]
            }},
            { $sort: { createdAt: -1 }},
        ]);

        if(newData == null || newData.length <= 0){
            return { code: -1, error: 'Tạo phiếu thu không thành công', data: {} };
        }

        //#region Ghi log
        var content = {
            code: newData[0].code
        }
        await CustomerLog.CreateLog(newData[0].customerId, 'payment', newData[0]._id, content, newData[0].createdBy);
        //#endregion

        return { code: 1, error: '', data: newData[0] };
    }
    catch(err){
        console.log(err);
        return { code: 0, error: err, data: {} };
    }
}

module.exports = mongoose.model('tw_Receipts', tw_Receipts);