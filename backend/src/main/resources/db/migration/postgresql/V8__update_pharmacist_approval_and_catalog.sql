ALTER TABLE pharmacists
    DROP COLUMN IF EXISTS max_sessions,
    DROP COLUMN IF EXISTS auto_assign,
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO catalogs (id, type, code, name, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'SPECIALTY', s.code, s.name, TRUE, NOW(), NOW()
FROM specialties s
WHERE NOT EXISTS (
    SELECT 1
    FROM catalogs c
    WHERE c.type = 'SPECIALTY'
      AND c.code = s.code
);

UPDATE pharmacists p
SET specialty_id = c.id
FROM specialties s
JOIN catalogs c
  ON c.type = 'SPECIALTY'
 AND c.code = s.code
WHERE p.specialty_id = s.id;

ALTER TABLE pharmacists
    DROP CONSTRAINT IF EXISTS pharmacists_specialty_id_fkey;

ALTER TABLE pharmacists
    ADD CONSTRAINT pharmacists_specialty_id_fkey
    FOREIGN KEY (specialty_id) REFERENCES catalogs(id);

DROP TABLE IF EXISTS specialties;
