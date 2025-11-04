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

// Legacy types - kept for backward compatibility
export interface InfoRequest {
  message: string;
  requiresFile?: boolean;
  requestedAt: string;
}

export interface InfoResponse {
  answer?: string;
  fileUrl?: string | null;
  submittedAt: string;
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
  productImageUrl?: string;
  receiptImageUrl?: string;
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
  // Legacy fields - kept for backward compatibility
  infoRequest?: InfoRequest;
  infoResponse?: InfoResponse;
}
