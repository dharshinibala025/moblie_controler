const admin = require("firebase-admin");
const logger = require("../utils/logger");

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    logger.info("Firebase Admin SDK initialized");
    return firebaseApp;
  } catch (err) {
    logger.error(`Firebase Admin init error: ${err.message}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    logger.warn("Firebase Admin not configured — FCM pushes will fail in dev mode");
    return null;
  }
};

const getFirebaseApp = () => firebaseApp;
const getMessaging = () => {
  if (!firebaseApp) return null;
  return admin.messaging();
};

module.exports = { initializeFirebase, getFirebaseApp, getMessaging };
