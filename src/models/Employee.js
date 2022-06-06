const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Employee = new Schema({
    fullName: { 
        type: String, 
        required: true 
    },
});

module.exports = mongoose.model('Employee', Employee);