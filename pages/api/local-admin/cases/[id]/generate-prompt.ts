import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../../../lib/auth";
import { getCaseById } from "../../../../../lib/cases";
import { buildPrompt } from "../../../../../lib/promptTemplates";

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
  const caseData = await getCaseById(id);
  if (!caseData) {
    res.status(404).json({ message: "Case not found" });
    return;
  }
  const prompt = buildPrompt(caseData);
  res.status(200).json({ prompt });
});
