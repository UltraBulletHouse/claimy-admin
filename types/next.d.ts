import type { JwtPayload } from "jsonwebtoken";

declare module "next" {
  interface NextApiRequest {
    admin?: {
      email: string;
      uid: string;
    };
    adminTokenPayload?: JwtPayload & {
      email: string;
      uid: string;
    };
  }
}
