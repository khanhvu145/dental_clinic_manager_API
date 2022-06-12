const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Employee = new Schema({
    code: { 
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
        required: true 
    },
    placeOfIssue: { 
        type: String, 
        required: true 
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
        required: true 
    },
    gender: { 
        type: String, 
        required: true 
    },
    address: { 
        type: Object,
        properties: { 
            building: { type: String },
            wardId: { type: Number, default: 0 },
            districtId: { type: Number, default: 0 },
            provinceId: { type: Number, default: 0 },
        }
    },
    image: { 
        type: Object,
        properties: { 
            imgName: { type: String, unique: true, required: true},
            imgType: { type: String, required: true},
            imgBase64: { type: String, required: true},
        }
    },
},
{
    timestamps: true,
});

Employee.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('Employee', Employee);