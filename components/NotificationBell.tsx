import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "../hooks/useNotifications";
import type { UserNotification } from "../types/notification";

export default function NotificationBell() {
  const { notifications, unreadCount, loading, error, refresh, markAsSeen } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleDropdown = () => {
    if (!open) {
      void refresh();
    }
    setOpen((prev) => !prev);
  };

  const handleSelect = async (notification: UserNotification) => {
    try {
      await markAsSeen(notification.id);
      setOpen(false);
      await router.push(`/cases/${notification.caseId}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to open notification");
    }
  };

  const showBadge = unreadCount > 0;
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label="Case notifications"
        aria-expanded={open}
        className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 18.5a2 2 0 11-4 0M6 8a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8z"
          />
        </svg>
        {showBadge && (
          <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {badgeLabel}
          </span>
        )}
      </button>
      {open && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={loading}
          error={error}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
