CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS idx_product_category_category_id;
CREATE INDEX idx_product_category_category_product ON product_category(category_id, product_id);

CREATE INDEX idx_products_name_trgm
    ON products USING gin (LOWER(name) gin_trgm_ops);

CREATE INDEX idx_products_web_name_trgm
    ON products USING gin (LOWER(web_name) gin_trgm_ops);

CREATE INDEX idx_products_slug_trgm
    ON products USING gin (LOWER(slug) gin_trgm_ops);

CREATE INDEX idx_product_variants_sku_trgm
    ON product_variants USING gin (LOWER(sku) gin_trgm_ops);

CREATE INDEX idx_categories_name_trgm
    ON categories USING gin (LOWER(name) gin_trgm_ops);
