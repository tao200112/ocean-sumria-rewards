-- ============================================================
-- 09_fix_500_error.sql
-- Fixes Infinite Recursion in RLS policies that causes 500 Errors
-- ============================================================

-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#infinite-recursion

-- 1. Create a SECURITY DEFINER function to check role without triggering RLS
CREATE OR REPLACE FUNCTION public.check_is_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role IN ('staff', 'manager', 'admin')
    );
END;
$$;

-- 2. Update Profiles Policies
DROP POLICY IF EXISTS "Staff view all" ON public.profiles;

CREATE POLICY "Staff view all" ON public.profiles 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

-- 3. Update Coupons Policies
DROP POLICY IF EXISTS "Staff view all coupons" ON public.coupons;

CREATE POLICY "Staff view all coupons" ON public.coupons 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

-- 4. Update Ledger Policies (Prevention)
DROP POLICY IF EXISTS "Staff view all ledger" ON public.ledger;

CREATE POLICY "Staff view all ledger" ON public.ledger 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

-- 5. Update Prize/Pool Policies (Prevention)
DROP POLICY IF EXISTS "Staff view all prizes" ON public.prizes;
DROP POLICY IF EXISTS "Staff view all pools" ON public.prize_pool_versions;

CREATE POLICY "Staff view all prizes" ON public.prizes 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

CREATE POLICY "Staff view all pools" ON public.prize_pool_versions 
FOR SELECT TO authenticated 
USING (public.check_is_staff());
