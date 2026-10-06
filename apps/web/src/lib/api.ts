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

type CacheOptions<T> = {
  force?: boolean;
  onRevalidate?: (response: ApiEnvelope<T>) => void;
};

type CacheEntry = {
  expiresAt: number;
  value: ApiEnvelope<unknown>;
};

const CACHE_TTL_MS = 30_000;
const CACHE_LIMIT = 50;
const responseCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<ApiEnvelope<unknown>>>();
let cacheGeneration = 0;

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

function requestUrl(path: string, params?: FetchOptions["params"]): URL {
  const url = new URL(path, getBaseUrl());

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  return url;
}

async function request<T>(url: URL, init: Omit<FetchOptions, "params">): Promise<ApiEnvelope<T>> {
  const method = init.method?.toUpperCase() ?? "GET";
  const bodyIsForm = init.body instanceof FormData;
  const token = ["GET", "HEAD", "OPTIONS"].includes(method) ? undefined : xsrfToken();

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

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<ApiEnvelope<T>> {
  const { params, ...init } = options;
  return request<T>(requestUrl(path, params), init);
}

function fetchAndCache<T>(url: URL, init: Omit<FetchOptions, "params">): Promise<ApiEnvelope<T>> {
  const key = url.toString();
  const canDedupe = !init.signal;
  const pending = canDedupe ? inFlight.get(key) : undefined;
  if (pending) return pending as Promise<ApiEnvelope<T>>;

  const generation = cacheGeneration;
  const promise = request<T>(url, init).then((response) => {
    if (generation === cacheGeneration) {
      if (responseCache.size >= CACHE_LIMIT) responseCache.delete(responseCache.keys().next().value!);
      responseCache.set(key, { value: response, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return response;
  }).finally(() => {
    if (canDedupe) inFlight.delete(key);
  });

  if (canDedupe) inFlight.set(key, promise as Promise<ApiEnvelope<unknown>>);
  return promise;
}

export async function cachedApiFetch<T>(path: string, options: FetchOptions = {}, cacheOptions: CacheOptions<T> = {}): Promise<ApiEnvelope<T>> {
  const { params, ...init } = options;
  const method = init.method?.toUpperCase() ?? "GET";
  if (method !== "GET" || path.startsWith("/api/v1/auth/")) return apiFetch<T>(path, options);

  const url = requestUrl(path, params);
  const key = url.toString();
  const cached = cacheOptions.force ? undefined : responseCache.get(key);

  if (cached) {
    responseCache.delete(key);
    responseCache.set(key, cached);

    if (cached.expiresAt <= Date.now()) {
      void fetchAndCache<T>(url, init).then(cacheOptions.onRevalidate).catch(() => undefined);
    }

    return cached.value as ApiEnvelope<T>;
  }

  return fetchAndCache<T>(url, init);
}

export function invalidateApiCache(...paths: string[]): void {
  cacheGeneration++;
  for (const key of responseCache.keys()) {
    const pathname = new URL(key).pathname;
    if (paths.some((path) => pathname.startsWith(path))) responseCache.delete(key);
  }
}

export function clearApiCache(): void {
  cacheGeneration++;
  responseCache.clear();
  inFlight.clear();
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
