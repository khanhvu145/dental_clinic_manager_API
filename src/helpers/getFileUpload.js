const firebaseDB = require('./firebase');

module.exports = (path) => {
    return url = path.getSignedUrl({
        version: 'v2',
        action: 'read',
        expires: '12-31-3000'
    });
};