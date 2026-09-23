export type ApiEnvelope<T> = {
  data: T;
  message: string;
  meta: Record<string, unknown> & {
    pagination?: Pagination;
    errors?: Record<string, string[]>;
    request_id?: string;
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type FetchOptions = Omit<RequestInit, "method"> & {
  method?: string;
  params?: Record<string, string | number | null | undefined>;
};

function getBaseUrl(): string {
  return typeof window === "undefined"
    ? (process.env.LARAVEL_API_ORIGIN ?? "http://localhost:8000")
    : window.location.origin;
}

function xsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<ApiEnvelope<T>> {
  const { params, ...init } = options;
  const url = new URL(path, getBaseUrl());
  const method = init.method?.toUpperCase() ?? "GET";
  const bodyIsForm = init.body instanceof FormData;
  const token = ["GET", "HEAD", "OPTIONS"].includes(method) ? undefined : xsrfToken();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(!bodyIsForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? "Permintaan gagal.", payload?.meta);
  }

  if (!payload) throw new ApiError(response.status, "Respons server tidak valid.");

  return payload;
}

export async function csrf(): Promise<void> {
  const response = await fetch(new URL("/sanctum/csrf-cookie", getBaseUrl()), {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new ApiError(response.status, "Gagal menyiapkan sesi aman.");
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public meta: ApiEnvelope<unknown>["meta"] = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  field(name: string): string | undefined {
    return this.meta.errors?.[name]?.[0];
  }
}

export function json(data: unknown): string {
  return JSON.stringify(data);
}
