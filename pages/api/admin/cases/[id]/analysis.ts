import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../../../lib/auth";
import { saveManualAnalysis } from "../../../../../lib/cases";

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
  const text = body?.text;
  if (typeof text !== "string") {
    res.status(400).json({ message: "Text required" });
    return;
  }
  const updated = await saveManualAnalysis(id, text, req.admin?.email ?? "admin");
  if (!updated) {
    res.status(404).json({ message: "Case not found" });
    return;
  }
  res.status(200).json(updated);
});
