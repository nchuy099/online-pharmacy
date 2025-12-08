ALTER TABLE chat_conversations
    ADD COLUMN IF NOT EXISTS consultation_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_consultation_id
    ON chat_conversations(consultation_id);
