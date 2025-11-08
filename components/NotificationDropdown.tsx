import type { UserNotification } from "../types/notification";

interface NotificationDropdownProps {
  notifications: UserNotification[];
  isLoading: boolean;
  error?: string | null;
  onSelect: (notification: UserNotification) => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(timestamp: string) {
  try {
    return dateFormatter.format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveCaseTitle(notification: UserNotification) {
  const fallbackId = notification.caseId ?? notification.id;
  return (
    notification.case?.product ||
    notification.case?.description ||
    notification.case?.store ||
    `Case ${fallbackId.substring(Math.max(fallbackId.length - 5, 0))}`
  );
}

export default function NotificationDropdown({
  notifications,
  isLoading,
  error,
  onSelect
}: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <p className="text-sm font-semibold text-slate-800">Status updates</p>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">Loading notifications…</div>
        ) : error ? (
          <div className="px-4 py-6 text-center text-sm text-rose-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">No unread notifications</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => onSelect(notification)}
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {resolveCaseTitle(notification)}
                  </span>
                  <span className="text-xs font-medium text-indigo-600">
                    {formatStatus(notification.newStatus)}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(notification.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
