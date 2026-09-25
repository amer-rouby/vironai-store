/**
 * Single source of truth for branding. Renaming the store or changing the currency happens here only.
 */
export const siteConfig = {
  name: { ar: "فيرونا", en: "VIRONAI" },
  tagline: {
    ar: "أناقة تُفصَّل على ذوقك",
    en: "Elegance, tailored to you",
  },
  /** PNG kept for Open Graph (social previews need PNG/JPEG); pages render the WebP set below. */
  logo: "/brand/logo.png",
  /** Pre-sized WebP renditions of the logo, picked by display width in the image loader. */
  logoSet: [
    { width: 96, src: "/brand/logo-96.webp" },
    { width: 192, src: "/brand/logo-192.webp" },
    { width: 640, src: "/brand/logo-640.webp" },
  ],
  currency: "EGP",
  contact: {
    instagram: "https://instagram.com/",
    whatsapp: "https://wa.me/",
  },
} as const;

export type Locale = "ar" | "en";
