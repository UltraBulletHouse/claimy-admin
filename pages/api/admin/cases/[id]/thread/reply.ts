import type { NextApiRequest, NextApiResponse } from "next/types";
import { withAdminAuth } from "../../../../../../lib/auth";
import { getCaseById, recordEmailSent } from "../../../../../../lib/cases";
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
  const { replySubject, body: replyBody } = {
    replySubject: body?.subject ?? "Reply from Claimy",
    body: body?.body
  };

  if (!replyBody) {
    res.status(400).json({ message: "Reply body required" });
    return;
  }

  const caseRecord = await getCaseById(id);
  if (!caseRecord) {
    res.status(404).json({ message: "Case not found" });
    return;
  }

  const threadId = caseRecord.emails.find((email) => email.threadId)?.threadId;
  if (!threadId) {
    res.status(400).json({ message: "No thread to reply to" });
    return;
  }

  const to = caseRecord.emails[caseRecord.emails.length - 1]?.from ?? caseRecord.userEmail;
  if (!to) {
    res.status(400).json({ message: "No recipient found for reply" });
    return;
  }

  await sendGmailMessage({
    to,
    subject: replySubject,
    body: replyBody,
    threadId
  });

  const updated = await recordEmailSent(
    id,
    {
      subject: replySubject,
      body: replyBody,
      to,
      from: process.env.GMAIL_USER ?? "",
      sentAt: new Date(),
      threadId
    },
    req.admin?.email ?? "admin"
  );

  if (!updated) {
    res.status(500).json({ message: "Failed to update case" });
    return;
  }

  res.status(200).json(updated);
});
