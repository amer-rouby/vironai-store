// End-to-end smoke test for checkout and orders. Usage: BASE=http://localhost:8080/api/v1 node scripts/smoke-orders.mjs
const B = process.env.BASE ?? "http://localhost:8080/api/v1";
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
const token = async (email, password, fullName) => {
  let r = await call("POST", "/auth/login", { email, password });
  if (r.status !== 200) r = await call("POST", "/auth/register", { email, password, fullName });
  return r.body.accessToken;
};
const address = { recipientName: "Test Buyer", phone: "01012345678", governorate: "CAIRO", city: "Nasr City", street: "Abbas El Akkad St", building: "12, floor 3" };
const key = () => crypto.randomUUID();

const admin = await token("admin@verona.com", "Admin@12345");
const alice = await token("alice.test@verona.local", "password123", "Alice Test");
const bob = await token("bob.test@verona.local", "password123", "Bob Test");

// Pick a product and two in-stock variants.
const detail = (await call("GET", "/catalog/products/checked-blazer")).body;
const inStock = detail.variants.filter((v) => v.stock >= 2);
const [v1, v2] = inStock;
const stockOf = async (id) => (await call("GET", "/catalog/products/checked-blazer")).body.variants.find((v) => v.id === id).stock;

// 1. Quote --------------------------------------------------------------------------------------
let q = await call("POST", "/checkout/quote", { items: [{ variantId: v1.id, quantity: 1 }, { variantId: v2.id, quantity: 1 }], governorate: "CAIRO" });
check("quote prices on the server", q.status === 200 && Number(q.body.subtotal) === Number(v1.price) + Number(v2.price), `subtotal=${q.body.subtotal}`);
check("quote: free shipping over threshold", Number(q.body.shippingFee) === 0, `fee=${q.body.shippingFee} (subtotal ≥ 2000)`);
q = await call("POST", "/checkout/quote", { items: [{ variantId: v1.id, quantity: 1 }], governorate: "ASWAN" });
check("quote: zone fee applies under threshold", Number(v1.price) >= 2000 || Number(q.body.shippingFee) === 80, `fee=${q.body.shippingFee}`);
q = await call("POST", "/checkout/quote", { items: [{ variantId: v1.id, quantity: 10 }] });
check("quote flags insufficient stock", q.body.lines[0].issue === (v1.stock === 0 ? "OUT_OF_STOCK" : v1.stock < 10 ? "INSUFFICIENT_STOCK" : null) && q.body.orderable === (v1.stock >= 10));
q = await call("POST", "/checkout/quote", { items: [{ variantId: 99999999, quantity: 1 }] });
check("quote flags unknown variant", q.body.lines[0].issue === "UNAVAILABLE" && !q.body.orderable);

// 2. Place + idempotency ------------------------------------------------------------------------
const before = await stockOf(v1.id);
const k = key();
const order = await call("POST", "/orders", { idempotencyKey: k, items: [{ variantId: v1.id, quantity: 2 }], address, paymentMethod: "CASH_ON_DELIVERY" }, alice);
check("place order → 201", order.status === 201, `${order.body?.orderNumber} total=${order.body?.total}`);
check("stock reserved", (await stockOf(v1.id)) === before - 2, `before=${before}`);
const retry = await call("POST", "/orders", { idempotencyKey: k, items: [{ variantId: v1.id, quantity: 2 }], address, paymentMethod: "CASH_ON_DELIVERY" }, alice);
check("same idempotency key returns the same order", retry.body.orderNumber === order.body.orderNumber);
check("retry did not reserve twice", (await stockOf(v1.id)) === before - 2);
check("totals: subtotal + shipping = total", Number(order.body.subtotal) + Number(order.body.shippingFee) === Number(order.body.total));
check("history starts at PENDING", order.body.history.length === 1 && order.body.history[0].status === "PENDING");

// 3. Ownership ----------------------------------------------------------------------------------
check("owner can read", (await call("GET", `/orders/${order.body.orderNumber}`, null, alice)).status === 200);
check("other customer gets 404 (not 403)", (await call("GET", `/orders/${order.body.orderNumber}`, null, bob)).status === 404);
check("guest gets 401", (await call("GET", `/orders/${order.body.orderNumber}`)).status === 401);
check("list mine", (await call("GET", "/orders", null, alice)).body.content.some((o) => o.orderNumber === order.body.orderNumber));

// 4. Validation ---------------------------------------------------------------------------------
const bad = await call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: v1.id, quantity: 1 }], address: { ...address, phone: "12345" }, paymentMethod: "CASH_ON_DELIVERY" }, alice);
check("invalid phone → field error", bad.status === 400 && bad.body.fieldErrors?.["address.phone"], JSON.stringify(bad.body.fieldErrors));
const over = await call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: v1.id, quantity: 10 }], address, paymentMethod: "CASH_ON_DELIVERY" }, alice);
check("ordering more than stock → CART_CHANGED", over.status === 409 && over.body.code === "CART_CHANGED");

// 5. Cancel -------------------------------------------------------------------------------------
const cancelled = await call("POST", `/orders/${order.body.orderNumber}/cancel`, null, alice);
check("customer cancels pending order", cancelled.body.status === "CANCELLED");
check("cancel returns stock", (await stockOf(v1.id)) === before);
const again = await call("POST", `/orders/${order.body.orderNumber}/cancel`, null, alice);
check("cannot cancel twice", again.status === 409 && again.body.code === "ORDER_NOT_CANCELLABLE");

// 6. Admin workflow -----------------------------------------------------------------------------
const o2 = (await call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: v2.id, quantity: 1 }], address, paymentMethod: "CASH_ON_DELIVERY", notes: "Please call first" }, bob)).body;
check("customer cannot use admin API", (await call("GET", "/admin/orders", null, bob)).status === 403);
const list = await call("GET", `/admin/orders?q=${o2.orderNumber}`, null, admin);
check("admin search by number", list.body.content.length === 1);
const id = list.body.content[0].id;
let s = await call("POST", `/admin/orders/${id}/status`, { status: "CONFIRMED" }, admin);
check("admin: PENDING → CONFIRMED", s.body.status === "CONFIRMED" && s.body.nextStatuses.includes("SHIPPED"));
s = await call("POST", `/admin/orders/${id}/status`, { status: "SHIPPED", note: "Bosta #123" }, admin);
check("admin: CONFIRMED → SHIPPED with note", s.body.status === "SHIPPED" && s.body.history.at(-1).note === "Bosta #123");
s = await call("POST", `/admin/orders/${id}/status`, { status: "CANCELLED" }, admin);
check("illegal transition SHIPPED → CANCELLED rejected", s.status === 409 && s.body.code === "INVALID_STATUS_TRANSITION");
check("customer can no longer cancel a shipped order", (await call("POST", `/orders/${o2.orderNumber}/cancel`, null, bob)).status === 409);
s = await call("POST", `/admin/orders/${id}/status`, { status: "DELIVERED" }, admin);
check("admin: SHIPPED → DELIVERED", s.body.status === "DELIVERED" && s.body.nextStatuses.length === 0 && s.body.customer.email);

// 7. Concurrency: more buyers than pieces -------------------------------------------------------
const target = (await call("GET", "/catalog/products/knit-poncho-shawl")).body.variants.find((v) => v.stock > 0);
const available = target.stock;
const buyers = available + 4;
const results = await Promise.all(
  Array.from({ length: buyers }, (_, i) =>
    call("POST", "/orders", { idempotencyKey: key(), items: [{ variantId: target.id, quantity: 1 }], address, paymentMethod: "CASH_ON_DELIVERY" }, i % 2 ? alice : bob),
  ),
);
const ok = results.filter((r) => r.status === 201).length;
const after = (await call("GET", "/catalog/products/knit-poncho-shawl")).body.variants.find((v) => v.id === target.id).stock;
check(`concurrency: ${buyers} parallel buyers for ${available} pieces`, ok === available && after === 0, `succeeded=${ok}, stock now=${after}, others: ${[...new Set(results.filter((r) => r.status !== 201).map((r) => r.status + " " + r.body?.code))].join(", ")}`);

// Restore demo stock for the next person: cancel the concurrency orders through the admin API.
const toCancel = (await call("GET", `/admin/orders?status=PENDING&size=100`, null, admin)).body.content;
for (const o of toCancel) await call("POST", `/admin/orders/${o.id}/status`, { status: "CANCELLED", note: "test cleanup" }, admin);
check("cleanup restores stock", (await call("GET", "/catalog/products/knit-poncho-shawl")).body.variants.find((v) => v.id === target.id).stock === available);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures ? 1 : 0);
