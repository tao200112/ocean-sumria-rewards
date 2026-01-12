-- ============================================================
-- 06_rls_policies.sql - Row Level Security policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pool_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Staff/Manager/Admin can view ALL profiles (for customer lookup)
-- This uses a subquery that's safe because it only checks the CALLER's role
CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'manager', 'admin')
    )
);

-- Users can update their own profile (only name field via column grants)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Revoke direct modification rights, grant only specific columns
REVOKE INSERT, DELETE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name) ON public.profiles TO authenticated;

-- ============================================================
-- LEDGER POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view own ledger" ON public.ledger;
DROP POLICY IF EXISTS "Staff can view all ledger" ON public.ledger;

-- Users can view their own transaction history
CREATE POLICY "Users can view own ledger"
ON public.ledger FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff/Manager/Admin can view all ledger entries
CREATE POLICY "Staff can view all ledger"
ON public.ledger FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'manager', 'admin')
    )
);

-- No direct insert/update/delete for authenticated users
REVOKE INSERT, UPDATE, DELETE ON public.ledger FROM authenticated;

-- ============================================================
-- PRIZE_POOL_VERSIONS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view published pools" ON public.prize_pool_versions;
DROP POLICY IF EXISTS "Staff can view all pools" ON public.prize_pool_versions;
DROP POLICY IF EXISTS "Managers can manage pools" ON public.prize_pool_versions;

-- Anyone authenticated can view published pools
CREATE POLICY "Anyone can view published pools"
ON public.prize_pool_versions FOR SELECT
TO authenticated
USING (status = 'published');

-- Staff can view draft pools too
CREATE POLICY "Staff can view all pools"
ON public.prize_pool_versions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'manager', 'admin')
    )
);

-- Manager/Admin can insert/update/delete pools
CREATE POLICY "Managers can manage pools"
ON public.prize_pool_versions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('manager', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('manager', 'admin')
    )
);

-- ============================================================
-- PRIZES POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view published prizes" ON public.prizes;
DROP POLICY IF EXISTS "Staff can view all prizes" ON public.prizes;
DROP POLICY IF EXISTS "Managers can manage prizes" ON public.prizes;

-- Anyone can view prizes from published pools
CREATE POLICY "Anyone can view published prizes"
ON public.prizes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.prize_pool_versions ppv
        WHERE ppv.id = pool_version_id
        AND ppv.status = 'published'
    )
);

-- Staff can view all prizes
CREATE POLICY "Staff can view all prizes"
ON public.prizes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'manager', 'admin')
    )
);

-- Manager/Admin can manage all prizes
CREATE POLICY "Managers can manage prizes"
ON public.prizes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('manager', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('manager', 'admin')
    )
);

-- ============================================================
-- COUPONS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can view own coupons" ON public.coupons;
DROP POLICY IF EXISTS "Staff can view all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Staff can update coupons" ON public.coupons;

-- Users can view their own coupons
CREATE POLICY "Users can view own coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can view all coupons
CREATE POLICY "Staff can view all coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'manager', 'admin')
    )
);

-- Staff can update coupons (for redemption)
CREATE POLICY "Staff can update coupons"
ON public.coupons FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'manager', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('staff', 'manager', 'admin')
    )
);

SELECT 'RLS policies created.' AS status;
