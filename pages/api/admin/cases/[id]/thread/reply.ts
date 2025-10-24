import type { NextApiRequest, NextApiResponse } from "next/types";
import { withAdminAuth } from "../../../../../../lib/auth";
import { getCaseById, recordEmailSent } from "../../../../../../lib/cases";
import { sendGmailMessage, fetchThread, parseThreadMessages, fetchMessage } from "../../../../../../lib/gmail";

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
  const { body: replyBody } = { body: body?.body } as const;

  if (!replyBody) {
    res.status(400).json({ message: "Reply body required" });
    return;
  }

  const caseRecord = await getCaseById(id);
  if (!caseRecord) {
    res.status(404).json({ message: "Case not found" });
    return;
  }

  const lastMsg = caseRecord.emails[caseRecord.emails.length - 1];
  let threadId = lastMsg?.threadId;
  if (!threadId) {
    res.status(400).json({ message: "No thread to reply to" });
    return;
  }

  // Try to reply to the original sender in the last message (often 'From')
  const to = lastMsg?.from ?? caseRecord.userEmail;
  // Derive a reply subject based on last message subject
  const lastSubject = (caseRecord as any)?.emails?.[caseRecord.emails.length - 1]?.subject ?? '';
  const replySubject = lastSubject?.toLowerCase().startsWith('re:') ? lastSubject : `Re: ${lastSubject || 'Case update'}`;
  // If missing message-id or to strengthen threading, fetch the thread and take the last Gmail 'Message-ID'
  let replyToMessageId = (lastMsg as any)?.messageId || undefined;
  let references = caseRecord.emails
    .map((e: any) => e.messageId)
    .filter(Boolean) as string[];

  try {
    const thread = await fetchThread(threadId);
    const parsed = parseThreadMessages(thread);
    const last = parsed[parsed.length - 1];
    // We don't expose message-id in parsed messages yet; try to extract from raw headers
    const rawHeaders = (thread.messages?.[thread.messages.length - 1]?.payload?.headers) || [];
    const getHeader = (name: string) => rawHeaders.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value;
    const msgId = getHeader('Message-ID') || getHeader('Message-Id');
    if (msgId && !replyToMessageId) replyToMessageId = msgId;
    const refs = getHeader('References');
    if (refs) {
      const list = refs.split(/\s+/).filter(Boolean);
      references = Array.from(new Set([...(references || []), ...list]));
    }
  } catch (e) {
    // non-fatal, continue
  }
  if (!to) {
    res.status(400).json({ message: "No recipient found for reply" });
    return;
  }

  await sendGmailMessage({
    to,
    subject: replySubject,
    body: replyBody,
    threadId,
    replyToMessageId: replyToMessageId,
    referencesMessageIds: references
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
