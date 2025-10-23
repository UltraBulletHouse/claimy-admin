export interface ApiClientOptions {
  token: string | null;
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit,
  { token }: ApiClientOptions
): Promise<T> {
  if (!token) {
    throw new Error("No admin session token");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res.json();
}
