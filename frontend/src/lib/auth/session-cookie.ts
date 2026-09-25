export const SESSION_COOKIE = "vr_session";

export const sessionCookieOptions = (expiresAt: string) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  expires: new Date(expiresAt),
});
