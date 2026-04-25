ALTER TABLE flash_sale_campaigns
    ADD COLUMN campaign_type VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN slot_code VARCHAR(50),
    ADD COLUMN cover_image TEXT;

CREATE INDEX idx_flash_sale_campaigns_type ON flash_sale_campaigns(campaign_type);
CREATE INDEX idx_flash_sale_campaigns_slot ON flash_sale_campaigns(slot_code);
