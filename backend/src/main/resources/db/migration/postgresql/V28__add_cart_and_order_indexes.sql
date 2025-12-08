CREATE INDEX idx_cart_items_cart_created_id ON cart_items(cart_id, created_at DESC, id DESC);
DROP INDEX IF EXISTS idx_cart_items_cart_id;
CREATE INDEX idx_orders_ghn_order_code ON orders(ghn_order_code);
CREATE INDEX idx_payments_external_transaction_id ON payments(external_transaction_id);
