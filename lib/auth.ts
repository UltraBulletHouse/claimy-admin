import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { verifyAdminSessionToken } from "./sessionToken";

export function extractBearerToken(header?: string | null) {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

export function withAdminAuth<T = any>(
  handler: NextApiHandler<T>
): NextApiHandler<T> {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    const adminSecret = extractBearerToken(req.headers.authorization);
    if (!adminSecret) {
      res.status(401).json({ message: "Missing Authorization header" } as any);
      return;
    }

    const verified = verifyAdminSessionToken(adminSecret);
    if (!verified) {
      res.status(401).json({ message: "Invalid or expired admin token" } as any);
      return;
    }

    if (verified.email !== process.env.ADMIN_EMAIL) {
      res.status(403).json({ message: "Forbidden" } as any);
      return;
    }

    req.admin = {
      uid: verified.uid,
      email: verified.email
    };
    req.adminTokenPayload = verified;

    return handler(req, res);
  };
}
