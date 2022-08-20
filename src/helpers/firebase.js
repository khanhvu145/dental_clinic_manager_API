const admin = require('firebase-admin')
const serviceAccount = require("../../serviceAccountKey.json");
const dotenv = require('dotenv');
dotenv.config();
const firebaseprojectid = process.env.FIREBASE_PROJECT_ID;
// Initialize firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: firebaseprojectid
})
// Cloud storage
const bucket = admin.storage().bucket()

module.exports = {
  bucket
}