-- ============================================================
-- 04_indexes_constraints.sql - Performance indexes and additional constraints
-- ============================================================

-- PROFILES indexes
CREATE INDEX IF NOT EXISTS idx_profiles_public_id ON public.profiles(public_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- LEDGER indexes
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON public.ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_actor_id ON public.ledger(actor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger(type);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON public.ledger(created_at DESC);

-- PRIZE POOL VERSIONS indexes
CREATE INDEX IF NOT EXISTS idx_pool_versions_status ON public.prize_pool_versions(status);

-- PRIZES indexes
CREATE INDEX IF NOT EXISTS idx_prizes_pool_version ON public.prizes(pool_version_id);
CREATE INDEX IF NOT EXISTS idx_prizes_active ON public.prizes(active) WHERE active = TRUE;

-- COUPONS indexes
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons(expires_at) WHERE status = 'active';

SELECT 'Indexes created.' AS status;
