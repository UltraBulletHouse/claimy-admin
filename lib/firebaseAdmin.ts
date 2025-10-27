import * as admin from "firebase-admin";

const {
  FIREBASE_PROJECT_ID = "",
  FIREBASE_CLIENT_EMAIL = "",
  FIREBASE_PRIVATE_KEY
} = process.env;

if (!admin.apps.length) {
  const hasInlineKey = Boolean(FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL);

  const credential = hasInlineKey
    ? admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: (FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, "\n")
      })
    : admin.credential.applicationDefault();

  if (!credential) {
    throw new Error("Missing Firebase admin environment variables");
  }

  admin.initializeApp({
    credential,
    projectId: FIREBASE_PROJECT_ID
  });
}

export default admin;
