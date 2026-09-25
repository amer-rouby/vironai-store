import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api/server";
import type { AuthResponse } from "@/lib/api/types";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-cookie";

/**
 * POST /api/auth/login | /api/auth/register  -> exchanges credentials for a JWT and stores it httpOnly.
 * POST /api/auth/logout                      -> clears the session cookie.
 * The response body only carries the user profile, never the token.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;

  if (action === "logout") {
    const res = new NextResponse(null, { status: 204 });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  if (action !== "login" && action !== "register") {
    return NextResponse.json({ status: 404, code: "NOT_FOUND", message: "Unknown auth action" }, { status: 404 });
  }

  const upstream = await fetch(`${BACKEND_URL}/api/v1/auth/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await req.text(),
    cache: "no-store",
  });
  const body = await upstream.json();
  if (!upstream.ok) return NextResponse.json(body, { status: upstream.status });

  const auth = body as AuthResponse;
  const res = NextResponse.json(auth.user, { status: upstream.status });
  res.cookies.set(SESSION_COOKIE, auth.accessToken, sessionCookieOptions(auth.expiresAt));
  return res;
}
