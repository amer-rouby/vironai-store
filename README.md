# VIRONAI · فيرونا — Fashion Store

Bilingual (Arabic RTL / English) womenswear e-commerce platform.

| Layer    | Stack |
|----------|-------|
| Frontend | Next.js 16 (App Router, Server Components) · TypeScript · Tailwind CSS 4 · next-intl · TanStack Query · Zustand · React Hook Form + Zod |
| Backend  | Spring Boot 4.1 · Java 17 · Spring Security (stateless JWT) · Spring Data JPA / Hibernate 7 · MapStruct · Flyway · springdoc OpenAPI |
| Database | PostgreSQL |

## Architecture highlights

**Backend: modular monolith, feature packages** (`catalog/`, `identity/`, `security/`, `shared/`).
- `shared/crud`: `AbstractCrudService` + `AbstractCrudController` + `CrudMapper`. A new admin resource is an entity, a DTO record, a MapStruct interface, and a service/controller that only override hooks (`searchSpec`, `validate`, `apply`, `beforeDelete`).
- `Product` is an aggregate root: images and variants (color × size, own SKU and stock) change only through it. Variants are reconciled by combination, so their ids survive edits (orders will reference them).
- Storefront reads use dedicated read models and JPA Specifications with `EXISTS` sub-queries (no duplicate rows, correct paging).
- One error envelope (`ApiError`) with stable `code`s and per-field `fieldErrors`. The frontend maps these straight onto form fields.
- `LocalizedText` embeddable, which the API exposes as `{ "ar": "...", "en": "..." }`.

**Ordering (`ordering/`).**
- The server prices every order. The browser only sends variant ids and quantities, so a tampered cart cannot change the charge.
- Stock is reserved with a conditional `UPDATE … SET stock = stock - n WHERE stock >= n` per variant, in a fixed lock order, inside the order transaction. Overselling is impossible: 12 parallel buyers for 8 pieces gives exactly 8 orders. Any failure rolls every reservation back.
- Idempotency keys make a double-clicked or retried "place order" return the same order.
- The lifecycle `PENDING → CONFIRMED → SHIPPED → DELIVERED` (plus `CANCELLED`, which restocks) is enforced by the `OrderStatus` state machine. There is a full status history.
- Order lines snapshot name, color, size, SKU and price, so past orders stay accurate after catalog edits.
- Shipping uses 4 zones covering Egypt's 27 governorates, with a free-shipping threshold, all configured in `application.yml`.
- `scripts/smoke-orders.mjs` holds 29 end-to-end checks (pricing, idempotency, ownership, transitions, concurrency).

**Back office (`reporting/`, `media/`, `identity/admin/`).**
- The dashboard is computed in SQL (`JdbcClient`) over Cairo calendar days. It includes revenue, orders, average order value, new customers vs the previous period, gap-free daily series, best sellers and low stock. Cancelled orders never count.
- Uploads go through a `MediaStorage` interface. The local implementation is active now; Cloudinary or S3 slot in as another bean. The file type is detected from magic bytes (JPEG/PNG/WebP), never from the client's name or type. Files get random server-chosen names and 5 MB cap. They are served under `/media/**` with a one-year immutable cache, from their own security chain.
- Customers are never deleted, only disabled. A disabled account is locked out at once, even with a still-valid JWT. Admin accounts cannot be disabled.
- Stock is optimistically locked: a product form saved after a sale changed its stock is rejected (`STALE_DATA`) instead of overwriting it.

**Frontend: config-driven admin, BFF auth, design tokens.**
- `features/admin/engine`: one `ResourceManager` renders list, search, pagination, create/edit dialog, server-validation errors and delete for **any** resource from a config in `features/admin/resources`. A new admin screen is a config entry. A new field type is one component in the field registry.
- Backend-for-frontend: the JWT sits in an **httpOnly cookie**, and `/api/backend/*` proxies to Spring and attaches it. Page JavaScript never sees the token, and no CORS is needed.
- Theming: semantic CSS tokens (`bg-surface`, `text-primary`, and so on) with 4 palettes × light/dark/system. A boot script applies the theme before first paint, so there is no flash.
- Fonts are self-hosted (Cairo, Aref Ruqaa, Cormorant Garamond), so the build never calls Google.
- The URL is the source of truth for shop filters, so links are shareable and back/forward and SSR work.

## Run with Docker (whole stack, one command)

```bash
docker compose up --build -d
```

| Service  | URL |
|----------|-----|
| Store    | http://localhost:3001 |
| API      | http://localhost:8081 (Swagger: `/swagger-ui.html`) |
| Postgres | `localhost:5434` · db `verona` · `root` / `root` |

Host ports are offset from the defaults so the containers can run beside a local dev setup.
Images are multi-stage and run as non-root: a layered Spring Boot jar on a JRE, and a Next.js standalone server on Node Alpine.
Stop with `docker compose down`. Add `-v` to also wipe the database volume.

## Run for development

Requirements: JDK 17+, Node 20+, and PostgreSQL with an empty database named `verona`.

```bash
# backend: http://localhost:8080  (or run StoreApplication from IntelliJ)
cd backend && ./mvnw spring-boot:run

# frontend: http://localhost:3000  (hot reload)
cd frontend && npm install && npm run dev
```

Flyway creates the schema and seeds a demo catalog. A bootstrap admin is created on first start:
`admin@verona.com` / `Admin@12345` (override with `VERONA_ADMIN_EMAIL` / `VERONA_ADMIN_PASSWORD`).

### Configuration

All backend variables are prefixed `VERONA_` so machine-wide variables from other projects never leak in:
`VERONA_DB_URL`, `VERONA_DB_USERNAME`, `VERONA_DB_PASSWORD`, `VERONA_JWT_SECRET` (base64, ≥ 32 bytes, **required outside local dev**), `VERONA_JWT_EXPIRATION`, `VERONA_CORS_ORIGINS`, `VERONA_PORT`.

Frontend: `BACKEND_URL` (default `http://localhost:8080`), `SITE_URL` (for Open Graph URLs).

## Roadmap

- [x] Phase 1: catalog, variants, auth, admin CRUD engine, storefront, themes, i18n
- [x] Phase 2: checkout, orders with atomic stock reservation, cash on delivery, order tracking, admin order workflow
- [x] Phase 3: Paymob-ready online payments (HMAC-verified callbacks, retry, auto-expiry), owner settings, bilingual order e-mails (Mailpit in Docker: http://localhost:8026)
- [x] Phase 4: image upload (pluggable `MediaStorage`, local disk now), sales dashboard, customer management, stale-stock protection, fully responsive UI
- [ ] Phase 5: SEO (sitemap, structured data), deployment, backups
