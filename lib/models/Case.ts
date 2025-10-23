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
        "new",
        "inReview",
        "sent",
        "waitingReply",
        "needMoreInfo",
        "approved",
        "rejected"
      ],
      default: "new"
    } as { type: StringConstructor; enum: CaseStatus[]; default: CaseStatus },
    statusHistory: [StatusHistorySchema]
  },
  {
    timestamps: true
  }
);

const CaseModel = models.Case || mongoose.model("Case", CaseSchema);

export default CaseModel;
