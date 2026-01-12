-- ============================================================
-- 01_extensions.sql - Enable required PostgreSQL extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- For gen_random_uuid(), gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- For uuid_generate_v4() if needed

SELECT 'Extensions enabled.' AS status;
