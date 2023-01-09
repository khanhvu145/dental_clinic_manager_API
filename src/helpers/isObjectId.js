const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

module.exports = (value) => {
    if(ObjectId.isValid(value)){
        if((new ObjectId(value)).toString() == value) return true;       
        return false;
    }
    return false;
};