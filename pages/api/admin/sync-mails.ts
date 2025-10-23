import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "../../../lib/auth";
import { listCases, upsertEmailsFromThread } from "../../../lib/cases";
import { fetchThread, mapThreadToEmails, parseThreadMessages } from "../../../lib/gmail";

export default withAdminAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const batchSize = 20;
  const { items } = await listCases({ limit: batchSize, skip: 0 });

  await Promise.all(
    items
      .filter((caseItem) => caseItem.emails.some((email) => email.threadId))
      .map(async (caseItem) => {
        const threadId =
          caseItem.emails.find((email) => email.threadId)?.threadId ?? undefined;
        if (!threadId) return;
        const thread = await fetchThread(threadId);
        const parsed = parseThreadMessages(thread);
        const mapped = mapThreadToEmails(caseItem, parsed);
        await upsertEmailsFromThread(caseItem._id, threadId, mapped);
      })
  );

  res.status(200).json({ synced: true });
});
