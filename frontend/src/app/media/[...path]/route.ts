import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api/server";

/**
 * Serves uploaded images from the backend under the storefront's own origin (/media/*). Resolved at
 * request time, so the backend address comes from the runtime environment, not the build.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const upstream = await fetch(`${BACKEND_URL}/media/${path.map(encodeURIComponent).join("/")}`);
  if (!upstream.ok) return new NextResponse(null, { status: upstream.status });

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "cache-control", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-content-type-options", "nosniff");
  return new NextResponse(upstream.body, { status: 200, headers });
}
