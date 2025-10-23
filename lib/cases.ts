import mongoose from "mongoose";
import CaseModel from "./models/Case";
import connectMongo from "./mongodb";
import type { CaseRecord, CaseStatus } from "../types/case";

export interface ListCasesParams {
  status?: string;
  q?: string;
  limit?: number;
  skip?: number;
}

export async function listCases(params: ListCasesParams) {
  await connectMongo();
  const { status, q, limit = 20, skip = 0 } = params;
  const filter: Record<string, unknown> = {};
  if (status) {
    filter.status = status;
  }
  if (q) {
    filter.$or = [
      { storeName: { $regex: q, $options: "i" } },
      { productName: { $regex: q, $options: "i" } },
      { userEmail: { $regex: q, $options: "i" } }
    ];
  }

  const [items, total] = await Promise.all([
    CaseModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CaseModel.countDocuments(filter)
  ]);

  return {
    items: items.map(mapCase),
    total
  };
}

export async function getCaseById(id: string) {
  await connectMongo();
  const doc = await CaseModel.findById(id).lean();
  if (!doc) {
    return null;
  }
  return mapCase(doc);
}

export async function saveManualAnalysis(id: string, text: string, by: string) {
  await connectMongo();
  const now = new Date();
  const doc = await CaseModel.findByIdAndUpdate(
    id,
    {
      manualAnalysis: { text, updatedAt: now },
      $push: {
        statusHistory: {
          status: "inReview",
          by,
          at: now,
          note: "Manual analysis updated"
        }
      },
      status: "inReview"
    },
    { new: true }
  ).lean();
  return doc ? mapCase(doc) : null;
}

export async function saveEmailDraft(
  id: string,
  draft: { subject: string; body: string; to: string },
  by: string
) {
  await connectMongo();
  const now = new Date();
  const doc = await CaseModel.findByIdAndUpdate(
    id,
    {
      $push: {
        statusHistory: {
          status: "inReview",
          by,
          at: now,
          note: "Email draft updated"
        }
      }
    },
    { new: true }
  ).lean();
  if (!doc) {
    return null;
  }

  return {
    draft: {
      subject: draft.subject,
      body: draft.body,
      to: draft.to
    },
    case: mapCase(doc)
  };
}

export async function recordEmailSent(
  id: string,
  email: {
    subject: string;
    body: string;
    to: string;
    from: string;
    sentAt: Date;
    threadId?: string;
  },
  by: string
) {
  await connectMongo();
  const now = new Date();
  const doc = await CaseModel.findByIdAndUpdate(
    id,
    {
      $push: {
        emails: email,
        statusHistory: {
          status: "sent",
          by,
          at: now,
          note: `Email sent to ${email.to}`
        }
      },
      status: "sent"
    },
    { new: true }
  ).lean();
  return doc ? mapCase(doc) : null;
}

export async function upsertEmailsFromThread(
  id: string,
  threadId: string,
  emails: CaseRecord["emails"]
) {
  await connectMongo();
  const existing = await CaseModel.findById(id);
  if (!existing) {
    return null;
  }
  const merged = mergeThreadEmails(existing.emails || [], emails);
  existing.emails = merged.map((email) => ({
    ...email,
    sentAt: new Date(email.sentAt)
  }));
  await existing.save();
  return mapCase(existing.toObject());
}

export async function replyStatusUpdate(
  id: string,
  status: CaseStatus,
  note: string,
  by: string
) {
  await connectMongo();
  const now = new Date();
  const doc = await CaseModel.findByIdAndUpdate(
    id,
    {
      status,
      $push: {
        statusHistory: {
          status,
          by,
          at: now,
          note
        }
      }
    },
    { new: true }
  ).lean();
  return doc ? mapCase(doc) : null;
}

export async function requestInfo(
  id: string,
  message: string,
  by: string
) {
  await connectMongo();
  const now = new Date();
  const doc = await CaseModel.findByIdAndUpdate(
    id,
    {
      status: "needMoreInfo",
      $push: {
        statusHistory: {
          status: "needMoreInfo",
          by,
          at: now,
          note: message
        }
      }
    },
    { new: true }
  ).lean();
  return doc ? mapCase(doc) : null;
}

export async function approveCase(
  id: string,
  code: string,
  by: string
) {
  await connectMongo();
  const now = new Date();
  const doc = await CaseModel.findByIdAndUpdate(
    id,
    {
      status: "approved",
      resolution: {
        code,
        addedAt: now
      },
      $push: {
        statusHistory: {
          status: "approved",
          by,
          at: now,
          note: `Resolution code ${code}`
        }
      }
    },
    { new: true }
  ).lean();
  return doc ? mapCase(doc) : null;
}

export async function rejectCase(
  id: string,
  note: string,
  by: string
) {
  await connectMongo();
  const now = new Date();
  const doc = await CaseModel.findByIdAndUpdate(
    id,
    {
      status: "rejected",
      $push: {
        statusHistory: {
          status: "rejected",
          by,
          at: now,
          note
        }
      }
    },
    { new: true }
  ).lean();
  return doc ? mapCase(doc) : null;
}

export async function deleteCase(
  id: string,
  deleteAssets: boolean
) {
  await connectMongo();
  const doc = await CaseModel.findById(id).lean();
  if (!doc) {
    return null;
  }
  await CaseModel.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
  return {
    case: mapCase(doc),
    deleteAssets: Boolean(deleteAssets)
  };
}

function mapCase(doc: any): CaseRecord {
  return {
    _id: doc._id.toString(),
    userId: doc.userId ?? undefined,
    userName: doc.userName ?? undefined,
    userEmail: doc.userEmail ?? undefined,
    storeName: doc.storeName ?? undefined,
    productName: doc.productName ?? undefined,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    imageUrls: doc.imageUrls ?? undefined,
    cloudinaryPublicIds: doc.cloudinaryPublicIds ?? undefined,
    manualAnalysis: doc.manualAnalysis
      ? {
          text: doc.manualAnalysis.text,
          updatedAt: doc.manualAnalysis.updatedAt?.toISOString() ?? ""
        }
      : undefined,
    emails: (doc.emails ?? []).map((email: any) => ({
      subject: email.subject,
      body: email.body,
      to: email.to,
      from: email.from,
      sentAt: email.sentAt?.toISOString() ?? new Date().toISOString(),
      threadId: email.threadId ?? undefined
    })),
    resolution: doc.resolution
      ? {
          code: doc.resolution.code ?? undefined,
          addedAt: doc.resolution.addedAt?.toISOString() ?? undefined
        }
      : undefined,
    status: doc.status,
    statusHistory: (doc.statusHistory ?? []).map((entry: any) => ({
      status: entry.status,
      by: entry.by,
      at: entry.at?.toISOString() ?? new Date().toISOString(),
      note: entry.note ?? undefined
    }))
  };
}

function mergeThreadEmails(
  existing: any[],
  incoming: CaseRecord["emails"]
) {
  const byKey = new Map<string, CaseRecord["emails"][number]>();
  for (const entry of existing) {
    const key = `${entry.threadId ?? ""}-${entry.sentAt.toISOString()}`;
    byKey.set(key, {
      subject: entry.subject,
      body: entry.body,
      to: entry.to,
      from: entry.from,
      sentAt: entry.sentAt.toISOString(),
      threadId: entry.threadId ?? undefined
    });
  }
  for (const entry of incoming) {
    const key = `${entry.threadId ?? ""}-${entry.sentAt}`;
    byKey.set(key, entry);
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );
}
