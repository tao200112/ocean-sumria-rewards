-- ============================================================
-- 09_fix_rls_recursion_FINAL.sql
-- 终极修复：完全消除 RLS 递归问题
-- ============================================================

-- 方案：创建一个单独的角色缓存表，并使用触发器保持同步

-- 步骤 1：创建角色缓存表（无 RLS）
DROP TABLE IF EXISTS public.user_roles_cache CASCADE;
CREATE TABLE public.user_roles_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'customer',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 不启用 RLS - 这个表专门用于权限检查
ALTER TABLE public.user_roles_cache DISABLE ROW LEVEL SECURITY;

-- 步骤 2：填充缓存（从现有 profiles 复制数据）
INSERT INTO public.user_roles_cache (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- 步骤 3：创建触发器函数，在 profiles 更新时同步缓存
CREATE OR REPLACE FUNCTION public.sync_role_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.user_roles_cache (user_id, role, updated_at)
        VALUES (NEW.id, NEW.role, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.user_roles_cache WHERE user_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 步骤 4：创建触发器
DROP TRIGGER IF EXISTS sync_role_cache_trigger ON public.profiles;
CREATE TRIGGER sync_role_cache_trigger
AFTER INSERT OR UPDATE OF role OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_role_cache();

-- 步骤 5：创建新的权限检查函数（使用缓存表）
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('staff', 'manager', 'admin')
     FROM public.user_roles_cache
     WHERE user_id = auth.uid()
     LIMIT 1),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles_cache
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 步骤 6：删除所有旧的有问题的策略
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all ledger" ON public.ledger;
DROP POLICY IF EXISTS "Staff can view all pools" ON public.prize_pool_versions;
DROP POLICY IF EXISTS "Staff can view all prizes" ON public.prizes;
DROP POLICY IF EXISTS "Staff can view all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Managers can manage pools" ON public.prize_pool_versions;
DROP POLICY IF EXISTS "Managers can manage prizes" ON public.prizes;

-- 步骤 7：创建新策略（使用缓存函数，无递归）
CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_staff_user());

CREATE POLICY "Staff can view all ledger"
ON public.ledger FOR SELECT
TO authenticated
USING (public.is_staff_user());

CREATE POLICY "Staff can view all pools"
ON public.prize_pool_versions FOR SELECT
TO authenticated
USING (public.is_staff_user());

CREATE POLICY "Managers can manage pools"
ON public.prize_pool_versions FOR ALL
TO authenticated
USING (public.is_staff_user())
WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can view all prizes"
ON public.prizes FOR SELECT
TO authenticated
USING (public.is_staff_user());

CREATE POLICY "Managers can manage prizes"
ON public.prizes FOR ALL
TO authenticated
USING (public.is_staff_user())
WITH CHECK (public.is_staff_user());

CREATE POLICY "Staff can view all coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (public.is_staff_user());

-- 步骤 8：为新的 tile_match 表添加策略（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tile_match_daily') THEN
        DROP POLICY IF EXISTS "Users view own tile_match_daily" ON public.tile_match_daily;
        CREATE POLICY "Users view own tile_match_daily"
        ON public.tile_match_daily FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tile_match_runs') THEN
        DROP POLICY IF EXISTS "Users view own tile_match_runs" ON public.tile_match_runs;
        CREATE POLICY "Users view own tile_match_runs"
        ON public.tile_match_runs FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

SELECT '✅ RLS 递归问题已彻底修复（使用角色缓存表）' AS status;
