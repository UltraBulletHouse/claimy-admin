import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../../../lib/auth";
import { requestInfo } from "../../../../../lib/cases";

export default withAdminAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }
  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid id" });
    return;
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const message = body?.message;
  const requiresFile = Boolean(body?.requiresFile);
  const requiresYesNo = Boolean(body?.requiresYesNo);
  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ message: "Message required" });
    return;
  }
  const updated = await requestInfo(id, message, req.admin?.email ?? "admin", requiresFile, requiresYesNo);
  if (!updated) {
    res.status(404).json({ message: "Case not found" });
    return;
  }
  res.status(200).json(updated);
});
