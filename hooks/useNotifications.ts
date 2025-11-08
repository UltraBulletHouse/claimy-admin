import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useAdminSession } from "../context/AdminSessionContext";
import { graphQLRequest, getGraphqlEndpoint } from "../lib/graphqlClient";
import type { UserNotification } from "../types/notification";

const GET_USER_NOTIFICATIONS = `
  query GetUserNotifications {
    getUserNotifications {
      id
      userId
      caseId
      oldStatus
      newStatus
      seen
      createdAt
      case {
        id
        store
        product
        description
        status
      }
    }
  }
`;

const MARK_NOTIFICATION_SEEN = `
  mutation MarkNotificationAsSeen($notificationId: ID!) {
    markNotificationAsSeen(notificationId: $notificationId)
  }
`;

const NOTIFICATION_ADDED_SUBSCRIPTION = `
  subscription NotificationAdded {
    notificationAdded {
      id
      userId
      caseId
      oldStatus
      newStatus
      seen
      createdAt
      case {
        id
        store
        product
        description
        status
      }
    }
  }
`;

function upsertNotification(list: UserNotification[], incoming: UserNotification) {
  const existsIndex = list.findIndex((item) => item.id === incoming.id);
  if (existsIndex >= 0) {
    const clone = [...list];
    clone[existsIndex] = incoming;
    return clone;
  }
  return [incoming, ...list].slice(0, 25);
}

interface UseNotificationsResult {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsSeen: (id: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { adminSession } = useAdminSession();
  const authToken = adminSession?.firebaseIdToken ?? null;
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await graphQLRequest<{
        getUserNotifications: UserNotification[];
      }>({
        query: GET_USER_NOTIFICATIONS,
        token: authToken
      });
      setNotifications(data.getUserNotifications ?? []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const markAsSeen = useCallback(
    async (id: string) => {
      if (!authToken) return;
      try {
        await graphQLRequest<{ markNotificationAsSeen: boolean }, { notificationId: string }>({
          query: MARK_NOTIFICATION_SEEN,
          variables: { notificationId: id },
          token: authToken
        });
        setNotifications((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [authToken]
  );

  useEffect(() => {
    if (!authToken) {
      setNotifications([]);
      return;
    }
    void refresh();
  }, [authToken, refresh]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    let cancelled = false;
    let controller: AbortController | null = null;
    const timers: number[] = [];

    // Event listener: subscribes to the backend GraphQL SSE stream so we can
    // react to status changes in real time. A future AI model that predicts
    // which notifications matter most could tap into this handler before we
    // call setNotifications and decide how/if to surface the event.
    const connect = async () => {
      if (cancelled) return;
      controller = new AbortController();
      const currentController = controller;

      try {
        const endpoint = getGraphqlEndpoint();
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            query: NOTIFICATION_ADDED_SUBSCRIPTION
          }),
          signal: currentController.signal
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to open notification stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processBuffer = () => {
          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            handleEvent(rawEvent);
            boundary = buffer.indexOf("\n\n");
          }
        };

        const handleEvent = (raw: string) => {
          if (!raw.trim()) return;
          const lines = raw.split("\n");
          let eventName = "message";
          let dataPayload = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataPayload += `${line.slice(5).trim()}\n`;
            }
          }

          if (eventName === "next" && dataPayload) {
            try {
              const parsed = JSON.parse(dataPayload);
              const incoming = parsed?.data?.notificationAdded as UserNotification | undefined;
              if (incoming) {
                setNotifications((prev) => upsertNotification(prev, incoming));
              }
            } catch (parseErr) {
              console.error("Failed to parse notification event", parseErr);
            }
          }
        };

        while (!cancelled && controller === currentController) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Notification subscription error", err);
          const timer = window.setTimeout(() => {
            connect().catch((error) => console.error(error));
          }, 5000);
          timers.push(timer);
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      controller?.abort();
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [authToken]);

  const unreadCount = notifications.length;

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markAsSeen
    }),
    [notifications, unreadCount, loading, error, refresh, markAsSeen]
  );
}
