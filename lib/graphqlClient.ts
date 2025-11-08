interface GraphQLRequestOptions<TVariables extends Record<string, unknown> | undefined = undefined> {
  query: string;
  variables?: TVariables;
  token?: string | null;
  signal?: AbortSignal;
}

const DEFAULT_GRAPHQL_ENDPOINT = "https://claimy-backend.vercel.app/api/graphql";

export function getGraphqlEndpoint() {
  const fromEnv = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/$/, "")}/api/graphql`;
  }
  return DEFAULT_GRAPHQL_ENDPOINT;
}

export async function graphQLRequest<TResponse, TVariables extends Record<string, unknown> | undefined = undefined>({
  query,
  variables,
  token,
  signal
}: GraphQLRequestOptions<TVariables>): Promise<TResponse> {
  const endpoint = getGraphqlEndpoint();

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables
    }),
    signal
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "GraphQL request failed");
  }

  const payload = await res.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL error");
  }

  return payload.data as TResponse;
}
