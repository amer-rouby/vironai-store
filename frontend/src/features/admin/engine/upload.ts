"use client";

import { toApiError } from "@/lib/api/errors";

export const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads one image through the BFF; the server re-checks type and size, this only fails fast. */
export async function uploadImage(file: File): Promise<string> {
  if (!ACCEPTED_IMAGES.split(",").includes(file.type)) throw Object.assign(new Error("UNSUPPORTED_IMAGE"), { code: "UNSUPPORTED_IMAGE" });
  if (file.size > MAX_BYTES) throw Object.assign(new Error("FILE_TOO_LARGE"), { code: "FILE_TOO_LARGE" });

  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/backend/admin/media", { method: "POST", body });
  if (!res.ok) throw await toApiError(res);
  return ((await res.json()) as { url: string }).url;
}
