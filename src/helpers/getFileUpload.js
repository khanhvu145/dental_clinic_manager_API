const firebaseDB = require('./firebase');

module.exports = (path) => {
    return url = path.getSignedUrl({
        version: 'v2',
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60
    });
};