const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Customer = new Schema(
    {
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
        birthday: { 
            type: Date, 
            required: true 
        },
        gender: { 
            type: String, 
            required: true 
        },
        phone: { 
            type: String, 
            required: true 
        },
        address: { 
            type: Object,
            properties: { 
                building: { type: String },
                wardId: { type: Int64, default: 0 },
                districtId: { type: Int64, default: 0 },
                provinceId: { type: Int64, default: 0 },
            }
        },
        email: { 
            type: String
        },
        image: { 
            type: Object,
            properties: { 
                imgName: { type: String, unique: true, required: true},
                imgType: { type: String, required: true},
                imgBase64: { type: String, required: true},
            }
        },
        allergies: [Schema.Types.ObjectId],
        background_diseases:[Schema.Types.ObjectId]
    },
    {
        timestamps: true,
    },
);

Customer.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('Customer', Customer);