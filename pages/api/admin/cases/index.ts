import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../../lib/auth";
import { listCases } from "../../../../lib/cases";

export default withAdminAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const { status, q, limit = "20", skip = "0" } = req.query;

  const result = await listCases({
    status: typeof status === "string" ? status : undefined,
    q: typeof q === "string" ? q : undefined,
    limit: Number(limit),
    skip: Number(skip)
  });

  res.status(200).json(result);
});
