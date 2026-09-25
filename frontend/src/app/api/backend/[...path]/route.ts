import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api/server";
import { SESSION_COOKIE } from "@/lib/auth/session-cookie";

/**
 * Backend-for-frontend proxy: forwards /api/backend/<path> to the Spring API under /api/v1/<path>,
 * attaching the JWT from the httpOnly cookie. Same-origin for the browser, so no CORS and no token in JS.
 */
async function forward(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${BACKEND_URL}/api/v1/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", "application/json");
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const response = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status });
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) response.headers.set("content-type", upstreamType);
  // Token expired or revoked: drop the stale cookie so the UI falls back to signed-out state.
  if (upstream.status === 401 && token) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
