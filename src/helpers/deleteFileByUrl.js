const firebaseDB = require('./firebase');

module.exports = async(fileUrl) => {
    try{
        const fileRef = firebaseDB.storage.refFromURL(fileUrl);
        await fileRef.delete();
        return { success: true };
    }
    catch(e){
        return { success: false, error: e };
    }
};