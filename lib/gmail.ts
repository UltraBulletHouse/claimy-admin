import { google } from "googleapis";
import type { CaseRecord } from "../types/case";

const env = process.env as Record<string, string | undefined>;

function getConfig() {
  const CLIENT_ID = env.GMAIL_CLIENT_ID || env.GOOGLE_CLIENT_ID || env.NEXT_PUBLIC_GMAIL_CLIENT_ID || env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = env.GMAIL_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET || env.NEXT_PUBLIC_GMAIL_CLIENT_SECRET || env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = env.GMAIL_REFRESH_TOKEN || env.GMAIL_OAUTH_REFRESH_TOKEN || env.GOOGLE_REFRESH_TOKEN || env.NEXT_PUBLIC_GMAIL_REFRESH_TOKEN;
  const USER = env.GMAIL_USER || env.MAIL_FROM || env.EMAIL_FROM || env.SMTP_USER || env.NEXT_PUBLIC_GMAIL_USER || env.ADMIN_EMAIL;
  return { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, USER };
}

function assertConfig() {
  const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, USER } = getConfig();
  const missing: string[] = [];
  if (!CLIENT_ID) missing.push('GMAIL_CLIENT_ID/GOOGLE_CLIENT_ID');
  if (!CLIENT_SECRET) missing.push('GMAIL_CLIENT_SECRET/GOOGLE_CLIENT_SECRET');
  if (!REFRESH_TOKEN) missing.push('GMAIL_REFRESH_TOKEN/GMAIL_OAUTH_REFRESH_TOKEN');
  if (!USER) missing.push('GMAIL_USER/MAIL_FROM/EMAIL_FROM');
  if (missing.length) {
    throw new Error(`Gmail OAuth is not configured. Missing: ${missing.join(', ')}`);
  }
}

function getOAuth2Client() {
  const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = getConfig();
  assertConfig();
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return oauth2Client;
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  attachments?: GmailAttachment[];
  threadId?: string;
}

export async function sendGmailMessage(options: SendEmailOptions) {
  const oauth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const { USER } = getConfig();
  const message = buildMimeMessage({
    from: USER as string,
    to: options.to,
    subject: options.subject,
    body: options.body,
    attachments: options.attachments
  });

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: base64UrlEncode(message),
      threadId: options.threadId
    }
  });

  return res.data;
}

function buildMimeMessage(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: GmailAttachment[];
}) {
  const boundary = "boundary_" + Date.now();
  const headers = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    params.attachments?.length
      ? `Content-Type: multipart/mixed; boundary="${boundary}"`
      : `Content-Type: text/plain; charset="UTF-8"`
  ];

  if (!params.attachments?.length) {
    return `${headers.join("\r\n")}\r\n\r\n${params.body}`;
  }

  const parts: string[] = [];
  parts.push(`--${boundary}`);
  parts.push('Content-Type: text/plain; charset="UTF-8"');
  parts.push("Content-Transfer-Encoding: 7bit");
  parts.push("");
  parts.push(params.body);

  for (const attachment of params.attachments) {
    parts.push(`--${boundary}`);
    parts.push(
      `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`
    );
    parts.push("Content-Transfer-Encoding: base64");
    parts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
    parts.push("");
    parts.push(attachment.data.toString("base64"));
  }

  parts.push(`--${boundary}--`);

  return `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`;
}

export async function fetchThread(threadId: string) {
  const oauth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const { data } = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full"
  });
  return data;
}

export interface ParsedThreadMessage {
  id: string;
  threadId: string;
  subject: string;
  from?: string;
  to?: string;
  date?: string;
  snippet?: string;
  bodyPlain?: string;
}

export function parseThreadMessages(thread: any): ParsedThreadMessage[] {
  if (!thread?.messages?.length) {
    return [];
  }
  return thread.messages.map((message: any) => {
    const headers = message.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader("Subject") ?? "",
      from: getHeader("From"),
      to: getHeader("To"),
      date: getHeader("Date"),
      snippet: message.snippet,
      bodyPlain: extractPlainText(message.payload)
    };
  });
}

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function extractPlainText(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  if (payload.parts?.length) {
    for (const part of payload.parts) {
      const found = extractPlainText(part);
      if (found) return found;
    }
  }
  return "";
}

export function mapThreadToEmails(
  caseRecord: CaseRecord,
  threadMessages: ParsedThreadMessage[]
) {
  return threadMessages.map((msg) => ({
    subject: msg.subject,
    body: msg.bodyPlain ?? msg.snippet ?? "",
    to: msg.to ?? caseRecord.userEmail ?? "",
    from: msg.from ?? "",
    sentAt: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
    threadId: msg.threadId
  }));
}
