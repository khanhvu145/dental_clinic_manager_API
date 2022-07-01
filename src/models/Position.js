const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Position = new Schema({
    name: { 
        type: String,
        required: true 
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true,
});

Position.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('Position', Position);