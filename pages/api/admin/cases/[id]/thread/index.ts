import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../../../../../lib/auth";
import { getCaseById, upsertEmailsFromThread } from "../../../../../../../lib/cases";
import { fetchThread, mapThreadToEmails, parseThreadMessages } from "../../../../../../../lib/gmail";

export default withAdminAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const caseRecord = await getCaseById(id);
  if (!caseRecord) {
    res.status(404).json({ message: "Case not found" });
    return;
  }

  const threadId = caseRecord.emails.find((email) => email.threadId)?.threadId;
  if (!threadId) {
    res.status(200).json({ messages: [] });
    return;
  }

  const thread = await fetchThread(threadId);
  const messages = parseThreadMessages(thread);
  const mapped = mapThreadToEmails(caseRecord, messages);
  await upsertEmailsFromThread(id, threadId, mapped);

  res.status(200).json({ messages });
});
