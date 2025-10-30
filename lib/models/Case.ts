import mongoose, { Schema, models } from "mongoose";
import type { CaseStatus } from "../../types/case";

const EmailSchema = new Schema(
  {
    subject: String,
    body: String,
    to: String,
    from: String,
    sentAt: Date,
    threadId: String
  },
  { _id: false }
);

const StatusHistorySchema = new Schema(
  {
    status: String,
    by: String,
    at: { type: Date, default: Date.now },
    note: String
  },
  { _id: false }
);

const InfoRequestSchema = new Schema(
  {
    message: { type: String, required: true },
    requiresFile: { type: Boolean, default: false },
    requestedAt: { type: Date, required: true },
  },
  { _id: false }
);

const InfoResponseSchema = new Schema(
  {
    answer: { type: String },
    fileUrl: { type: String, default: null },
    submittedAt: { type: Date, required: true },
  },
  { _id: false }
);

const CaseSchema = new Schema(
  {
    userId: String,
    userName: String,
    userEmail: String,
    storeName: String,
    productName: String,
    createdAt: { type: Date, default: Date.now },
    imageUrls: {
      product: String,
      receipt: String
    },
    cloudinaryPublicIds: {
      product: String,
      receipt: String
    },
    manualAnalysis: {
      text: String,
      updatedAt: Date
    },
    emails: [EmailSchema],
    resolution: {
      code: String,
      addedAt: Date
    },
    status: {
      type: String,
      enum: [
        // lowercase variants (legacy schema)
        "new",
        "inReview",
        "sent",
        "waitingReply",
        "needMoreInfo",
        "approved",
        "rejected",
        // uppercase variants (admin/types usage)
        "PENDING",
        "IN_REVIEW",
        "NEED_INFO",
        "APPROVED",
        "REJECTED"
      ],
      default: "new"
    } as unknown as { type: StringConstructor; enum: string[]; default: string },
    statusHistory: [StatusHistorySchema],
    infoRequest: { type: InfoRequestSchema, default: null },
    infoResponse: { type: InfoResponseSchema, default: null }
  },
  {
    timestamps: true
  }
);

const CaseModel = models.Case || mongoose.model("Case", CaseSchema);

export default CaseModel;
