"use client";

import { siteConfig } from "@/config/site";

/**
 * Image CDN loader. Remote catalog images are resized by their own CDN and fetched by the browser
 * directly, so the Next.js server never downloads or re-encodes them (fast, and no server timeouts
 * on slow upstream links). Local assets under /public are served as-is.
 */
// Catalog photos never need more than this; larger srcset candidates reuse the same file.
const MAX_WIDTH = 1600;

export default function imageLoader({ src, width: requested, quality }: { src: string; width: number; quality?: number }) {
  const q = quality ?? 75;
  const width = Math.min(requested, MAX_WIDTH);

  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(q));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }

  if (src.startsWith("https://res.cloudinary.com/")) {
    // .../image/upload/<public-id>  ->  .../image/upload/f_auto,q_75,w_640,c_limit/<public-id>
    return src.replace("/upload/", `/upload/f_auto,q_${q},w_${width},c_limit/`);
  }

  if (src === siteConfig.logo) {
    // Smallest pre-sized rendition that still covers the requested width (4 KB for the header, not 355 KB).
    return (siteConfig.logoSet.find((r) => r.width >= requested) ?? siteConfig.logoSet[siteConfig.logoSet.length - 1]).src;
  }

  // Local /public files: the width param keeps each srcset entry distinct; the static server ignores it.
  return src.startsWith("/") ? `${src}?w=${requested}` : src;
}
