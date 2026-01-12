-- ============================================================
-- 03_tables.sql - Core table definitions
-- ============================================================

-- A) PROFILES TABLE
-- Linked 1:1 with auth.users, auto-created via trigger
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'customer' 
        CHECK (role IN ('customer', 'staff', 'manager', 'admin')),
    public_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    spins INTEGER NOT NULL DEFAULT 0 CHECK (spins >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON COLUMN public.profiles.public_id IS 'QR code identifier for staff lookup (OS-XXXX format)';
COMMENT ON COLUMN public.profiles.role IS 'customer | staff | manager | admin';

-- B) LEDGER TABLE
-- Immutable audit log of all points/spins transactions
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'earn_points', 'adjust_points', 'convert_points', 
        'earn_spins', 'spend_spins', 'redeem_prize', 'admin_grant'
    )),
    delta_points INTEGER NOT NULL DEFAULT 0,
    delta_spins INTEGER NOT NULL DEFAULT 0,
    balance_points INTEGER,  -- Snapshot after transaction
    balance_spins INTEGER,   -- Snapshot after transaction
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ledger IS 'Immutable audit log of all balance changes';

-- C) PRIZE POOL VERSIONS TABLE
-- Allows versioned prize configurations
CREATE TABLE IF NOT EXISTS public.prize_pool_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    name TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.prize_pool_versions IS 'Versioned prize pool configurations';

-- D) PRIZES TABLE
-- Individual prizes within a pool
CREATE TABLE IF NOT EXISTS public.prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_version_id UUID NOT NULL REFERENCES public.prize_pool_versions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'discount' CHECK (type IN ('discount', 'free_item', 'bogo', 'points_bonus', 'no_win')),
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    total_available INTEGER,  -- NULL = unlimited
    given_count INTEGER NOT NULL DEFAULT 0,
    win_limit_per_user INTEGER,  -- NULL = no limit
    icon TEXT,
    color TEXT,
    value_description TEXT,  -- e.g., "10% Off", "$5 Credit"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.prizes IS 'Prize definitions within a pool version';
COMMENT ON COLUMN public.prizes.weight IS 'Relative probability weight for random selection';
COMMENT ON COLUMN public.prizes.total_available IS 'NULL means unlimited availability';

-- E) COUPONS TABLE
-- Generated when user wins a prize
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES public.prizes(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    expires_at TIMESTAMPTZ,
    redeemed_at TIMESTAMPTZ,
    redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.coupons IS 'User-won coupons from spin wheel';

SELECT 'Tables created.' AS status;
