export interface CaseNotificationContext {
  id: string;
  store?: string | null;
  product?: string | null;
  description?: string | null;
  status?: string | null;
}

export interface UserNotification {
  id: string;
  userId: string;
  caseId: string;
  oldStatus?: string | null;
  newStatus: string;
  seen: boolean;
  createdAt: string;
  case?: CaseNotificationContext | null;
}
