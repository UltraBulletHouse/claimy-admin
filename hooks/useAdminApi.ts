import { useMemo } from "react";
import { apiFetch } from "../lib/apiClient";
import { useAdminSession } from "../context/AdminSessionContext";

export function useAdminApi() {
  const { adminSession } = useAdminSession();

  return useMemo(() => {
    return {
      async get<T>(url: string) {
        return apiFetch<T>(
          url,
          { method: "GET" },
          { token: adminSession?.token ?? null, firebaseToken: adminSession?.firebaseIdToken ?? null }
        );
      },
      async post<T>(url: string, body: unknown) {
        return apiFetch<T>(
          url,
          {
            method: "POST",
            body: JSON.stringify(body)
          },
          { token: adminSession?.token ?? null, firebaseToken: adminSession?.firebaseIdToken ?? null }
        );
      },
      async put<T>(url: string, body: unknown) {
        return apiFetch<T>(
          url,
          {
            method: "PUT",
            body: JSON.stringify(body)
          },
          { token: adminSession?.token ?? null, firebaseToken: adminSession?.firebaseIdToken ?? null }
        );
      },
      async del<T>(url: string, body?: unknown) {
        return apiFetch<T>(
          url,
          {
            method: "DELETE",
            body: body ? JSON.stringify(body) : undefined
          },
          { token: adminSession?.token ?? null, firebaseToken: adminSession?.firebaseIdToken ?? null }
        );
      }
    };
  }, [adminSession?.token, adminSession?.firebaseIdToken]);
}
