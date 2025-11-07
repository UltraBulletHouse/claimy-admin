export type CaseStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "NEED_INFO"
  | "APPROVED"
  | "REJECTED";

export type InfoRequestStatus = "PENDING" | "ANSWERED" | "SUPERSEDED";

export interface CaseEmail {
  subject: string;
  body: string;
  to: string;
  from: string;
  sentAt: string;
  threadId?: string;
  messageId?: string;
  references?: string[];
}

export interface CaseResolution {
  code?: string;
  addedAt?: string;
  expiryDate?: string;
  used?: boolean;
}

// NEW: History tracking types
export interface InfoRequestHistoryEntry {
  id: string;
  message: string;
  requiresFile: boolean;
  requiresYesNo: boolean;
  requestedAt: string;
  requestedBy: string;
  status: InfoRequestStatus;
}

export interface InfoResponseHistoryEntry {
  id: string;
  requestId: string;
  answer?: string;
  fileUrl?: string | null;
  fileName?: string;
  fileType?: string;
  submittedAt: string;
  submittedBy: string;
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
  store?: string;
  product?: string;
  description?: string;
  createdAt: string;
  images?: string[];
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
  // NEW: History arrays
  infoRequestHistory?: InfoRequestHistoryEntry[];
  infoResponseHistory?: InfoResponseHistoryEntry[];
}
