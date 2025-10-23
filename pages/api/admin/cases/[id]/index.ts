import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../../../lib/auth";
import { deleteCase, getCaseById } from "../../../../../lib/cases";
import { deleteAsset } from "../../../../../lib/cloudinary";

export default withAdminAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid case id" });
    return;
  }

  if (req.method === "GET") {
    const caseData = await getCaseById(id);
    if (!caseData) {
      res.status(404).json({ message: "Case not found" });
      return;
    }
    res.status(200).json(caseData);
    return;
  }

  if (req.method === "DELETE") {
    const { deleteAssets } = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const result = await deleteCase(id, deleteAssets);
    if (!result) {
      res.status(404).json({ message: "Case not found" });
      return;
    }
    if (deleteAssets && result.case.cloudinaryPublicIds) {
      const { product, receipt } = result.case.cloudinaryPublicIds;
      if (product) {
        await deleteAsset(product);
      }
      if (receipt) {
        await deleteAsset(receipt);
      }
    }
    res.status(200).json({ success: true });
    return;
  }

  res.setHeader("Allow", "GET,DELETE");
  res.status(405).json({ message: "Method not allowed" });
});
