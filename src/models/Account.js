const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Account = new Schema({
    username: { 
        type: String,
        unique: true, 
        required: true 
    },
    password: { 
        type: String, 
        required: true
    },
    employeeId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "Employee"
    },
    roleId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        ref: "Role"
    }
},
{
    timestamps: true,
});

Account.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('Account', Account);