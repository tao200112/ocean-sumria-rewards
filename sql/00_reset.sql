-- ============================================================
-- 00_reset.sql - DANGER: Deletes ALL public schema objects
-- Run this ONLY when you want to completely rebuild the database
-- ============================================================

-- Drop all tables (cascade handles FKs)
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.prizes CASCADE;
DROP TABLE IF EXISTS public.prize_pool_versions CASCADE;
DROP TABLE IF EXISTS public.ledger CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.generate_public_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profiles_defaults() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_my_profile() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_find_user_by_public_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_add_points(text, int, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_add_spins(text, int, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_spin() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_redeem_coupon(text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_customer_convert_points(int) CASCADE;
DROP FUNCTION IF EXISTS public.add_points(text, int) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_get_customer_by_public_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_add_points(text, int, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_customer_spin_wheel() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_customer_convert_points(int) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_redeem_coupon(text) CASCADE;

-- Drop triggers on auth.users (careful!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Note: We do NOT drop auth.users - that's managed by Supabase Auth

SELECT 'Reset complete. All public schema objects dropped.' AS status;
