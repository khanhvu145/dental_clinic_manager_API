const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Employee = new Schema({
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
            wardId: { type: Number, default: 0 },
            districtId: { type: Number, default: 0 },
            provinceId: { type: Number, default: 0 },
        }
    },
    img: {
        type: String,
    },
    imageFile: {
        type: Object,
        default: null
    },
    // image: { 
    //     type: Object,
    //     properties: { 
    //         imageUrl: { type: String, required: true},
    //         imageFile: { type: String },
    //     }
    // },
    // position: {
    //     type: Schema.Types.ObjectId, 
    //     required: true 
    // },
    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true,
});

Employee.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('Employee', Employee);