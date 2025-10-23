export type CaseStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "NEED_INFO"
  | "APPROVED"
  | "REJECTED";

export interface CaseEmail {
  subject: string;
  body: string;
  to: string;
  from: string;
  sentAt: string;
  threadId?: string;
}

export interface CaseResolution {
  code?: string;
  addedAt?: string;
}

export interface StatusHistoryEntry {
  status: CaseStatus | string;
  by: string;
  at: string;
  note?: string;
}

export interface CaseRecord {
  _id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  storeName?: string;
  productName?: string;
  createdAt: string;
  imageUrls?: {
    product?: string;
    receipt?: string;
  };
  cloudinaryPublicIds?: {
    product?: string;
    receipt?: string;
  };
  manualAnalysis?: {
    text: string;
    updatedAt: string;
  };
  emails: CaseEmail[];
  resolution?: CaseResolution;
  status: CaseStatus;
  statusHistory?: StatusHistoryEntry[];
}
