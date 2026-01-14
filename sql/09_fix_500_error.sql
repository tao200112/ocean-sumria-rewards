-- ============================================================
-- 09_fix_rls_infinite_recursion.sql
-- 修复 RLS 策略中的无限递归问题
-- ============================================================

-- 步骤 1：创建一个 SECURITY DEFINER 函数来检查用户角色
-- 这个函数绕过 RLS，直接查询 profiles 表
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 步骤 2：创建辅助函数检查是否为 staff
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('staff', 'manager', 'admin')
     FROM public.profiles 
     WHERE id = auth.uid()
     LIMIT 1),
    FALSE
  );
$$;

-- 步骤 3: 删除所有可能导致递归的旧策略
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all ledger" ON public.ledger;
DROP POLICY IF EXISTS "Staff can view all pools" ON public.prize_pool_versions;
DROP POLICY IF EXISTS "Staff can view all prizes" ON public.prizes;
DROP POLICY IF EXISTS "Staff can view all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Managers can manage pools" ON public.prize_pool_versions;
DROP POLICY IF EXISTS "Managers can manage prizes" ON public.prizes;

-- 步骤 4：使用 SECURITY DEFINER 函数重建策略

-- Profiles 表
CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_staff_user());

-- Ledger 表
CREATE POLICY "Staff can view all ledger"
ON public.ledger FOR SELECT
TO authenticated
USING (public.is_staff_user());

-- Prize Pool Versions 表
CREATE POLICY "Staff can view all pools"
ON public.prize_pool_versions FOR SELECT
TO authenticated
USING (public.is_staff_user());

CREATE POLICY "Managers can manage pools"
ON public.prize_pool_versions FOR ALL
TO authenticated
USING (public.is_staff_user())
WITH CHECK (public.is_staff_user());

-- Prizes 表
CREATE POLICY "Staff can view all prizes"
ON public.prizes FOR SELECT
TO authenticated
USING (public.is_staff_user());

CREATE POLICY "Managers can manage prizes"
ON public.prizes FOR ALL
TO authenticated
USING (public.is_staff_user())
WITH CHECK (public.is_staff_user());

-- Coupons 表
CREATE POLICY "Staff can view all coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (public.is_staff_user());

SELECT 'RLS 无限递归问题已修复' AS status;
