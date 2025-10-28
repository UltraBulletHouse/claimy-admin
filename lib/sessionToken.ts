import jwt from "jsonwebtoken";

const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN as string;

if (!ADMIN_SECRET_TOKEN || ADMIN_SECRET_TOKEN.trim().length === 0) {
  throw new Error("Missing ADMIN_SECRET_TOKEN");
}

const SESSION_TTL_SECONDS = 60 * 60; // 1 hour

export interface AdminSessionPayload {
  uid: string;
  email: string;
}

export function createAdminSessionToken(payload: AdminSessionPayload) {
  const expiresIn = SESSION_TTL_SECONDS;
  const token = jwt.sign(payload, ADMIN_SECRET_TOKEN, {
    expiresIn
  });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  return { token, expiresAt };
}

export function verifyAdminSessionToken(token: string) {
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET_TOKEN) as jwt.JwtPayload & {
      uid: string;
      email: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}
