const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "") + "/api";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!("Content-Type" in headers) && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(url, config);

  const contentType = res.headers.get("content-type") || "";
  let data: unknown = null;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const maybeObj =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : undefined;

    const msgFromObj =
      (maybeObj && typeof maybeObj.error === "object" && maybeObj.error && 
       typeof (maybeObj.error as any).message === "string") ? (maybeObj.error as any).message :
      (maybeObj && typeof maybeObj.error === "string") ? maybeObj.error :
      (maybeObj && typeof maybeObj.message === "string") ? maybeObj.message :
      undefined;

    const msg =
      msgFromObj ??
      (typeof data === "string" && data.trim().length > 0
        ? data
        : `Request failed with status ${res.status}`);

    throw new Error(msg);
  }

  return data as T;
}

export { API_BASE_URL };
