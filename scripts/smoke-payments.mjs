// End-to-end checks for online payments (fake provider), store settings and e-mails.
// Backend must run with: VERONA_CARD_PROVIDER=fake VERONA_PAYMOB_HMAC_SECRET=test-hmac-secret
//   VERONA_PAYMENT_WINDOW=PT20S VERONA_MAIL_ENABLED=true (SMTP -> Mailpit)
// Usage: BASE=http://localhost:8090/api/v1 MAILPIT=http://localhost:8026 DB_CONTAINER=postgres-db_2 node scripts/smoke-payments.mjs
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const B = process.env.BASE ?? "http://localhost:8090/api/v1";
const MAILPIT = process.env.MAILPIT ?? "http://localhost:8026";
const DB = process.env.DB_CONTAINER ?? "postgres-db_2";
let failures = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
  if (!cond) failures++;
};
async function call(method, path, body, token) {
  const res = await fetch(B + path, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
const login = async (email, password, fullName) => {
  let r = await call("POST", "/auth/login", { email, password });
  if (r.status !== 200) r = await call("POST", "/auth/register", { email, password, fullName, locale: "ar" });
  return r.body.accessToken;
};
const sql = (q) => execSync(`docker exec ${DB} psql -U root -d verona -tAc "${q}"`).toString().trim();
const latestAttempt = (orderNumber) =>
  sql(`select p.provider_order_id from payments p join orders o on o.id = p.order_id where o.order_number = '${orderNumber}' order by p.id desc limit 1`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const address = { recipientName: "Pay Tester", phone: "01012345678", governorate: "GIZA", city: "Dokki", street: "Tahrir St" };
const key = () => crypto.randomUUID();

const admin = await login("admin@verona.com", "Admin@12345");
const buyer = await login("payer.test@verona.local", "password123", "Pay Tester");
await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });

// Settings -------------------------------------------------------------------------------------
await call("PUT", "/admin/settings", { cashOnDeliveryEnabled: true, cardPaymentsEnabled: false, orderNotificationEmail: "owner@verona.local" }, admin);
check("card hidden while switched off", JSON.stringify((await call("GET", "/checkout/options")).body.paymentMethods) === '["CASH_ON_DELIVERY"]');
const none = await call("PUT", "/admin/settings", { cashOnDeliveryEnabled: false, cardPaymentsEnabled: false }, admin);
check("cannot disable every payment method", none.status === 409 && none.body.code === "NO_PAYMENT_METHOD");
const variant = (await call("GET", "/catalog/products/ruffle-blouse")).body.variants.find((v) => v.stock >= 4);
const stock = async () => (await call("GET", "/catalog/products/ruffle-blouse")).body.variants.find((v) => v.id === variant.id).stock;
const blocked = await call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: variant.id, quantity: 1 }], address, paymentMethod: "CARD" }, buyer);
check("card order refused while switched off", blocked.status === 400 && blocked.body.code === "PAYMENT_METHOD_UNAVAILABLE");
const on = await call("PUT", "/admin/settings", { cashOnDeliveryEnabled: true, cardPaymentsEnabled: true, orderNotificationEmail: "owner@verona.local" }, admin);
check("owner enables card (gateway configured)", on.status === 200 && on.body.cardPaymentsEnabled && on.body.cardGatewayConfigured);
check("checkout now offers card", (await call("GET", "/checkout/options")).body.paymentMethods.includes("CARD"));

// Card order: declined, retried, paid ---------------------------------------------------------
const before = await stock();
const placed = await call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: variant.id, quantity: 2 }], address, paymentMethod: "CARD" }, buyer);
const order = placed.body;
check("card order awaits payment with a payment URL", placed.status === 201 && order.status === "PENDING_PAYMENT" && !!order.paymentUrl && !!order.paymentExpiresAt, order.orderNumber);
check("stock reserved while paying", (await stock()) === before - 2);
const adminRow = (await call("GET", `/admin/orders?q=${order.orderNumber}`, null, admin)).body.content[0];
check("admin cannot mark an order paid by hand", (await call("POST", `/admin/orders/${adminRow.id}/status`, { status: "PENDING" }, admin)).status === 409);

const forged = await fetch(`${B}/payments/paymob/webhook?hmac=deadbeef`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ type: "TRANSACTION", obj: { success: true, order: { id: latestAttempt(order.orderNumber) }, amount_cents: 1 } }),
});
check("forged callback rejected (bad HMAC)", forged.status === 401);

const declined = await call("POST", `/payments/fake/${latestAttempt(order.orderNumber)}?outcome=decline`, null, buyer);
check("declined card → attempt FAILED, order still awaiting payment", declined.body.result === "FAILED"
  && (await call("GET", `/orders/${order.orderNumber}`, null, buyer)).body.status === "PENDING_PAYMENT");

const retry = await call("POST", `/orders/${order.orderNumber}/pay`, null, buyer);
check("retry opens a new attempt", retry.status === 200 && !!retry.body.paymentUrl);
const attempt = latestAttempt(order.orderNumber);
const paid = await call("POST", `/payments/fake/${attempt}?outcome=success`, null, buyer);
const afterPay = (await call("GET", `/orders/${order.orderNumber}`, null, buyer)).body;
check("successful callback → order PENDING (paid)", paid.body.result === "PAID" && afterPay.status === "PENDING" && !afterPay.paymentExpiresAt,
  afterPay.history.at(-1)?.note);
const again = await call("POST", `/payments/fake/${attempt}?outcome=success`, null, buyer);
check("duplicate callback ignored (idempotent)", again.body.result === "IGNORED");
check("paid order keeps its stock", (await stock()) === before - 2);

// Expiry: an unpaid card order is cancelled and its stock returned ----------------------------
const mid = await stock();
const unpaid = (await call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: variant.id, quantity: 1 }], address, paymentMethod: "CARD" }, buyer)).body;
check("second card order reserves stock", (await stock()) === mid - 1);
let expired = false;
for (let i = 0; i < 24 && !expired; i++) {
  await sleep(5000);
  expired = (await call("GET", `/orders/${unpaid.orderNumber}`, null, buyer)).body.status === "CANCELLED";
}
check("unpaid order cancelled after the payment window", expired);
check("expired order released its stock", (await stock()) === mid);

// Cash on delivery + status e-mails ------------------------------------------------------------
const cod = (await call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: variant.id, quantity: 1 }], address, paymentMethod: "CASH_ON_DELIVERY" }, buyer)).body;
const codRow = (await call("GET", `/admin/orders?q=${cod.orderNumber}`, null, admin)).body.content[0];
await call("POST", `/admin/orders/${codRow.id}/status`, { status: "CONFIRMED" }, admin);
await call("POST", `/admin/orders/${codRow.id}/status`, { status: "SHIPPED", note: "Bosta #778" }, admin);
await sleep(4000);
const mails = (await (await fetch(`${MAILPIT}/api/v1/messages?limit=50`)).json()).messages ?? [];
const subjects = mails.map((m) => `${m.To?.[0]?.Address}: ${m.Subject}`);
console.log("  mails:\n   " + subjects.join("\n   "));
check("customer mail: paid order received", subjects.some((s) => s.startsWith("payer.test") && s.includes(order.orderNumber) && s.includes("استلمنا")));
check("store mail: new order alert", subjects.some((s) => s.startsWith("owner@") && s.includes(order.orderNumber)));
check("customer mail: expired order cancelled", subjects.some((s) => s.includes(unpaid.orderNumber) && s.includes("إلغاء")));
check("customer mail: COD confirmed + shipped", subjects.some((s) => s.includes(cod.orderNumber) && s.includes("تأكيد")) && subjects.some((s) => s.includes(cod.orderNumber) && s.includes("الطريق")));
check("no mail while awaiting payment", !subjects.some((s) => s.includes(unpaid.orderNumber) && s.includes("استلمنا")));

// Leave the store as the owner configured it: card off until a real gateway exists.
await call("PUT", "/admin/settings", { cashOnDeliveryEnabled: true, cardPaymentsEnabled: false, orderNotificationEmail: null }, admin);
await call("POST", `/admin/orders/${codRow.id}/status`, { status: "DELIVERED" }, admin);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures ? 1 : 0);
