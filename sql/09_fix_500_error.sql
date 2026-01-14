-- ============================================================
-- 09_fix_500_error.sql
-- 修复 RLS 无限递归导致的数据库超时问题
-- ============================================================

-- 1. 创建安全函数（SECURITY DEFINER 避免递归）
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

-- 2. 移除可能导致递归的旧策略
DROP POLICY IF EXISTS "Staff view all" ON public.profiles;
DROP POLICY IF EXISTS "Staff view all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Staff view all ledger" ON public.ledger;
DROP POLICY IF EXISTS "Staff view all prizes" ON public.prizes;
DROP POLICY IF EXISTS "Staff view all pools" ON public.prize_pool_versions;

-- 3. 重建优化后的策略（使用 SECURITY DEFINER 函数）
CREATE POLICY "Staff view all" ON public.profiles 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

CREATE POLICY "Staff view all coupons" ON public.coupons 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

CREATE POLICY "Staff view all ledger" ON public.ledger 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

CREATE POLICY "Staff view all prizes" ON public.prizes 
FOR SELECT TO authenticated 
USING (public.check_is_staff());

CREATE POLICY "Staff view all pools" ON public.prize_pool_versions 
FOR SELECT TO authenticated 
USING (public.check_is_staff());
