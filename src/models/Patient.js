const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Patient = new Schema(
    {
        fullname: { 
            type: String, 
            required: true 
        },
        dateofbirth: { 
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
                building: { type: String},
                ward: { type: String},
                district: { type: String},
                city: { type: String}
            }
        },
        email: { 
            type: String, 
            required: true 
        },
        image: { 
            type: Object,
            properties: { 
                imgName: { type: String, unique: true, required: true},
                imgType: { type: String, required: true},
                imgBase64: { type: String, required: true},
            }
        },
        allergies: [String],
        background_diseases:[String]
    },
    {
        timestamps: true,
    },
);

Patient.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('Patient', Patient);