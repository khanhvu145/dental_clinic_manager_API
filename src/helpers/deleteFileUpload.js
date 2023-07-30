const firebaseDB = require('./firebase');

module.exports = async(fileName) => {
    try{
        await firebaseDB.storage.bucket().file(fileName).delete();
        return { success: true };
    }
    catch(e){
        return { success: false, error: e };
    }
};