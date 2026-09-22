/**
 * API client configuration for same-origin /api proxy.
 * Server-side requests use LARAVEL_API_ORIGIN from env.
 * Browser requests use the same-origin /api prefix (proxied by Next.js).
 */

function getBaseUrl(): string {
  return typeof window === "undefined"
    ? (process.env.LARAVEL_API_ORIGIN ?? "http://localhost:8000")
    : window.location.origin;
}

type FetchOptions = Omit<RequestInit, "method"> & {
  params?: Record<string, string>;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions & { method?: string } = {},
): Promise<T> {
  const { params, ...init } = options;
  const url = new URL(path, getBaseUrl());
  const method = init.method?.toUpperCase() ?? "GET";
  const xsrfToken =
    typeof document === "undefined" || ["GET", "HEAD", "OPTIONS"].includes(method)
      ? undefined
      : document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
          ?.split("=")[1];

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": decodeURIComponent(xsrfToken) } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, await res.text());
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

export type HealthResponse = {
  data: {
    status: string;
    timestamp: string;
  };
  message: string;
  meta: {
    version: string;
    request_id: string;
  };
};

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/v1/health");
}
