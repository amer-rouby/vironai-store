import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/api/server";
import type { SessionUser } from "@/lib/api/types";
import { SESSION_COOKIE } from "./session-cookie";

/** Current user for this request (deduplicated per render), or null when signed out / token expired. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await backendFetch<SessionUser>("/api/v1/auth/me", { auth: true });
  } catch {
    return null;
  }
});
