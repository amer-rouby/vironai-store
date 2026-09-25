-- Identity ---------------------------------------------------------------
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    version       BIGINT       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    email         VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    phone         VARCHAR(30),
    role          VARCHAR(20)  NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX ux_users_email ON users (lower(email));

-- Catalog ----------------------------------------------------------------
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    version     BIGINT       NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    slug        VARCHAR(120) NOT NULL UNIQUE,
    name_ar     VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120) NOT NULL,
    image_url   VARCHAR(500),
    parent_id   BIGINT REFERENCES categories (id),
    sort_order  INT          NOT NULL DEFAULT 0,
    active      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE colors (
    id          BIGSERIAL PRIMARY KEY,
    version     BIGINT      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    name_ar     VARCHAR(60) NOT NULL,
    name_en     VARCHAR(60) NOT NULL,
    hex_code    VARCHAR(7)  NOT NULL,
    sort_order  INT         NOT NULL DEFAULT 0
);

CREATE TABLE sizes (
    id          BIGSERIAL PRIMARY KEY,
    version     BIGINT      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    code        VARCHAR(20) NOT NULL UNIQUE,
    sort_order  INT         NOT NULL DEFAULT 0
);

CREATE TABLE products (
    id               BIGSERIAL PRIMARY KEY,
    version          BIGINT        NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    slug             VARCHAR(160)  NOT NULL UNIQUE,
    name_ar          VARCHAR(160)  NOT NULL,
    name_en          VARCHAR(160)  NOT NULL,
    description_ar   TEXT          NOT NULL,
    description_en   TEXT          NOT NULL,
    category_id      BIGINT        NOT NULL REFERENCES categories (id),
    base_price       NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    compare_at_price NUMERIC(12,2) CHECK (compare_at_price >= 0),
    active           BOOLEAN       NOT NULL DEFAULT TRUE,
    featured         BOOLEAN       NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_products_category ON products (category_id);
CREATE INDEX ix_products_active_featured ON products (active, featured);

CREATE TABLE product_images (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    color_id    BIGINT REFERENCES colors (id),
    sort_order  INT          NOT NULL DEFAULT 0
);
CREATE INDEX ix_product_images_product ON product_images (product_id);

CREATE TABLE product_variants (
    id          BIGSERIAL PRIMARY KEY,
    version     BIGINT        NOT NULL DEFAULT 0,
    product_id  BIGINT        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    color_id    BIGINT        NOT NULL REFERENCES colors (id),
    size_id     BIGINT        NOT NULL REFERENCES sizes (id),
    sku         VARCHAR(60)   NOT NULL UNIQUE,
    price       NUMERIC(12,2) CHECK (price >= 0),
    stock       INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
    CONSTRAINT ux_variant_combination UNIQUE (product_id, color_id, size_id)
);
CREATE INDEX ix_variants_color ON product_variants (color_id);
CREATE INDEX ix_variants_size ON product_variants (size_id);
