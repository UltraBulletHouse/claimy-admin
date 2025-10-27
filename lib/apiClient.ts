export interface ApiClientOptions {
  token: string | null;
  firebaseToken?: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL &&
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL.trim()
    : "https://claimy-backend.vercel.app";

function resolveUrl(url: string): string {
  if (!API_BASE) {
    return url;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  try {
    return new URL(url, API_BASE).toString();
  } catch {
    return `${API_BASE.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit,
  { token, firebaseToken }: ApiClientOptions
): Promise<T> {
  if (!token) {
    throw new Error("No admin session token");
  }

  const targetUrl = resolveUrl(url);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`
  };

  if (firebaseToken) {
    headers["x-firebase-authorization"] = `Bearer ${firebaseToken}`;
  }

  const res = await fetch(targetUrl, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json();
}
