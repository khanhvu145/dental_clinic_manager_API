const firebaseDB = require('./firebase');

module.exports = (path, buffer) => {
    return image = path.createWriteStream().end(buffer);
};