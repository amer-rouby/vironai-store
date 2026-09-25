import "server-only";

import { cookies } from "next/headers";
import { toApiError } from "./errors";
import { SESSION_COOKIE } from "@/lib/auth/session-cookie";

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

interface ServerFetchOptions extends RequestInit {
  /** Attach the signed-in user's token (reads the httpOnly session cookie). */
  auth?: boolean;
  revalidate?: number;
}

/** Server-side call to the Spring Boot API (Server Components, Route Handlers). */
export async function backendFetch<T>(path: string, { auth, revalidate, headers, ...init }: ServerFetchOptions = {}): Promise<T> {
  const finalHeaders = new Headers(headers);
  if (auth) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: finalHeaders,
    ...(revalidate !== undefined ? { next: { revalidate } } : { cache: "no-store" as const }),
  });
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
