const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Role = new Schema({
    name: { 
        type: String,
        required: true 
    }
},
{
    timestamps: true,
});

Role.plugin(mongooseDelete, { 
    overrideMethods: 'all',
    deletedAt : true, 
});

module.exports = mongoose.model('Role', Role);