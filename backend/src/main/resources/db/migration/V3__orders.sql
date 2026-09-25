-- Orders ------------------------------------------------------------------------------------------
-- Lines keep a snapshot of what was bought (name, color, size, SKU, unit price) so an order stays
-- accurate after the catalog changes; the variant link is informational and survives product deletes.

CREATE SEQUENCE order_number_seq START WITH 100001;

CREATE TABLE orders (
    id                BIGSERIAL PRIMARY KEY,
    version           BIGINT        NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    order_number      VARCHAR(20)   NOT NULL UNIQUE,
    user_id           BIGINT        NOT NULL REFERENCES users (id),
    idempotency_key   VARCHAR(64)   NOT NULL,
    status            VARCHAR(20)   NOT NULL,
    payment_method    VARCHAR(20)   NOT NULL,
    subtotal          NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee      NUMERIC(12,2) NOT NULL CHECK (shipping_fee >= 0),
    total             NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    recipient_name    VARCHAR(120)  NOT NULL,
    phone             VARCHAR(30)   NOT NULL,
    governorate       VARCHAR(60)   NOT NULL,
    city              VARCHAR(80)   NOT NULL,
    street            VARCHAR(200)  NOT NULL,
    building          VARCHAR(120),
    notes             VARCHAR(500),
    CONSTRAINT ux_orders_user_idempotency UNIQUE (user_id, idempotency_key)
);
CREATE INDEX ix_orders_user_created ON orders (user_id, created_at DESC);
CREATE INDEX ix_orders_status_created ON orders (status, created_at DESC);

CREATE TABLE order_items (
    id             BIGSERIAL PRIMARY KEY,
    order_id       BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    variant_id     BIGINT        REFERENCES product_variants (id) ON DELETE SET NULL,
    product_slug   VARCHAR(160)  NOT NULL,
    product_name_ar VARCHAR(160) NOT NULL,
    product_name_en VARCHAR(160) NOT NULL,
    color_name_ar  VARCHAR(60)   NOT NULL,
    color_name_en  VARCHAR(60)   NOT NULL,
    color_hex      VARCHAR(7)    NOT NULL,
    size_code      VARCHAR(20)   NOT NULL,
    sku            VARCHAR(60)   NOT NULL,
    image_url      VARCHAR(500),
    unit_price     NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity       INT           NOT NULL CHECK (quantity > 0),
    line_total     NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX ix_order_items_order ON order_items (order_id);
CREATE INDEX ix_order_items_variant ON order_items (variant_id);

CREATE TABLE order_status_history (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT      NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL,
    note        VARCHAR(500),
    changed_by  BIGINT REFERENCES users (id),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_order_history_order ON order_status_history (order_id, changed_at);
