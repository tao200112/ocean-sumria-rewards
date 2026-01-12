-- ============================================================
-- 02_types_enums.sql - Custom types and enums
-- ============================================================

-- User roles enum (enforced via check constraint, not pg enum for flexibility)
-- Allowed values: customer, staff, manager, admin

-- Pool status enum
DO $$ BEGIN
    CREATE TYPE pool_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Coupon status enum
DO $$ BEGIN
    CREATE TYPE coupon_status AS ENUM ('active', 'redeemed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ledger entry types enum
DO $$ BEGIN
    CREATE TYPE ledger_type AS ENUM (
        'earn_points',      -- Customer earned points from purchase
        'adjust_points',    -- Admin/staff adjustment
        'convert_points',   -- Customer converted points to spins
        'earn_spins',       -- Staff granted spins
        'spend_spins',      -- Customer used spin
        'redeem_prize',     -- Prize redeemed
        'admin_grant'       -- Admin bonus
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

SELECT 'Types and enums created.' AS status;
