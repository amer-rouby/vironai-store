/**
 * Random request id for idempotent submits. Uses getRandomValues rather than randomUUID because the
 * latter only exists in secure contexts, and the store is also opened over plain http on the LAN.
 */
export function newIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
