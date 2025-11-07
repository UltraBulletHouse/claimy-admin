import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../../../../lib/auth";
import { getCaseById, recordEmailSent } from "../../../../../../lib/cases";
import { fetchAssetBuffer } from "../../../../../../lib/cloudinary";
import { sendGmailMessage } from "../../../../../../lib/gmail";

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
  const { subject, body: emailBody, to, attachProduct, attachReceipt, attachInfoFile } = body ?? {};
  if (!subject || !emailBody || !to) {
    res.status(400).json({ message: "Subject, body and to are required" });
    return;
  }
  const caseRecord = await getCaseById(id);
  if (!caseRecord) {
    res.status(404).json({ message: "Case not found" });
    return;
  }

  const attachments: Array<{ filename: string; mimeType: string; data: Buffer }> = [];
  const productImageUrl =
    caseRecord.imageUrls?.product ?? caseRecord.images?.[0];
  const receiptImageUrl =
    caseRecord.imageUrls?.receipt ??
    (caseRecord.images && caseRecord.images.length > 1 ? caseRecord.images[1] : undefined);

  if (attachProduct && productImageUrl) {
    const asset = await fetchAssetBuffer(productImageUrl);
    attachments.push({
      filename: "product.jpg",
      mimeType: asset.contentType,
      data: asset.data
    });
  }
  if (attachReceipt && receiptImageUrl) {
    const asset = await fetchAssetBuffer(receiptImageUrl);
    attachments.push({
      filename: "receipt.jpg",
      mimeType: asset.contentType,
      data: asset.data
    });
  }

  const threadId = caseRecord.emails.find((email) => email.threadId)?.threadId;

  const gmailMessage = await sendGmailMessage({
    to,
    subject,
    body: emailBody,
    attachments,
    threadId
  });

  const updated = await recordEmailSent(
    id,
    {
      subject,
      body: emailBody,
      to,
      from: process.env.GMAIL_USER ?? "",
      sentAt: new Date(),
      threadId: gmailMessage.threadId ?? threadId
    },
    req.admin?.email ?? "admin"
  );

  if (attachInfoFile && caseRecord.infoResponse?.fileUrl) {
    const asset = await fetchAssetBuffer(caseRecord.infoResponse.fileUrl);
    attachments.push({
      filename: "user-attachment.jpg",
      mimeType: asset.contentType,
      data: asset.data
    });
  }

  if (!updated) {
    res.status(500).json({ message: "Failed to update case with email" });
    return;
  }

  res.status(200).json(updated);
});
