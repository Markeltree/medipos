import { useAuthStore } from "@/store/auth-store";

/** Base URL of the MediPOS backend. Set NEXT_PUBLIC_API_URL at build time; it is inlined into the bundle. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

/**
 * Calls the backend with the signed-in user's token.
 * A 401 means the session is over, so it signs the user out; the dashboard then sends them to /login.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const { method = "GET", body, auth = true } = init;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = useAuthStore.getState().token;
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the MediPOS server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) useAuthStore.getState().logout();
    const first = data.details?.[0];
    const message = first ? `${data.error}: ${first.path ? `${first.path} – ` : ""}${first.message}` : data.error;
    throw new ApiError(res.status, message ?? `Request failed (${res.status})`, data.details);
  }
  return data as T;
}
