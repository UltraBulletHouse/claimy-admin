import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../../lib/firebaseAdmin";
import { createAdminSessionToken } from "../../../lib/sessionToken";
import { extractBearerToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const idToken = extractBearerToken(req.headers.authorization);
  if (!idToken) {
    res.status(401).json({ message: "Missing Firebase ID token" });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded.email || decoded.email !== process.env.ADMIN_EMAIL) {
      res.status(403).json({ message: "Unauthorized admin email" });
      return;
    }
    const session = createAdminSessionToken({
      uid: decoded.uid,
      email: decoded.email
    });
    res.status(200).json(session);
  } catch (err: any) {
    res.status(401).json({ message: err.message ?? "Invalid Firebase token" });
  }
}
