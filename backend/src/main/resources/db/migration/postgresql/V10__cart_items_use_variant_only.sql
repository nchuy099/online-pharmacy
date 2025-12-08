DROP INDEX IF EXISTS uq_cart_items_cart_product;
DROP INDEX IF EXISTS idx_cart_items_product_id;

ALTER TABLE cart_items
DROP COLUMN IF EXISTS product_id;
