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
  // Absolute URLs: return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Local Next.js API routes (same-origin): keep relative so Next can serve them
  if (url.startsWith("/api/") && !url.startsWith("/api/admin/")) {
    return url;
  }
  // Admin backend routes: send to configured API base
  const base = API_BASE;
  if (!base) {
    return url;
  }
  try {
    return new URL(url, base).toString();
  } catch {
    return `${base.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
  }
}

function normalizeIds<T>(data: T): T {
  const seen = new WeakSet();
  const deepNormalize = (value: any): any => {
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return value;

    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((v) => deepNormalize(v));
    }

    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepNormalize(v as any);
    }
    if (Object.prototype.hasOwnProperty.call(value, "id") && !Object.prototype.hasOwnProperty.call(value, "_id")) {
      out._id = (value as any).id;
    }
    return out;
  };
  return deepNormalize(data);
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

  const json = await res.json();
  return normalizeIds<T>(json);
}
