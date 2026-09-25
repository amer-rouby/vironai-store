-- Language used for a customer's e-mails (set from the storefront locale at sign-up).
ALTER TABLE users ADD COLUMN preferred_locale VARCHAR(5) NOT NULL DEFAULT 'ar';

-- Card orders wait in PENDING_PAYMENT until the gateway confirms; unpaid ones are cancelled after this instant.
ALTER TABLE orders ADD COLUMN payment_expires_at TIMESTAMPTZ;
CREATE INDEX ix_orders_payment_expiry ON orders (payment_expires_at) WHERE status = 'PENDING_PAYMENT';

-- One row per payment attempt (a customer may retry after a declined card).
CREATE TABLE payments (
    id                 BIGSERIAL PRIMARY KEY,
    version            BIGINT        NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    order_id           BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    provider           VARCHAR(20)   NOT NULL,
    status             VARCHAR(20)   NOT NULL,
    amount_cents       BIGINT        NOT NULL CHECK (amount_cents >= 0),
    currency           VARCHAR(3)    NOT NULL,
    -- Gateway-side order id (Paymob intention_order_id) used to match callbacks to this attempt.
    provider_order_id  VARCHAR(64),
    transaction_id     VARCHAR(64),
    failure_reason     VARCHAR(255)
);
CREATE UNIQUE INDEX ux_payments_provider_order ON payments (provider, provider_order_id);
CREATE UNIQUE INDEX ux_payments_transaction ON payments (provider, transaction_id);
CREATE INDEX ix_payments_order ON payments (order_id);

-- Store-wide switches the owner controls from the back office (single row).
CREATE TABLE store_settings (
    id                        SMALLINT     PRIMARY KEY CHECK (id = 1),
    version                   BIGINT       NOT NULL DEFAULT 0,
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    cash_on_delivery_enabled  BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Off until the owner has a payment gateway contract and turns it on.
    card_payments_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
    order_notification_email  VARCHAR(160)
);
INSERT INTO store_settings (id) VALUES (1);
