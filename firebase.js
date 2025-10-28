const admin = require("firebase-admin");
const serviceAccount = require("./config/supermall-525d6-firebase-adminsdk-fbsvc-9c2c7e400f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };