-- ============================================================
-- 09_smoke_tests.sql - Verification queries and test calls
-- Run these AFTER creating a test user through Supabase Auth
-- ============================================================

-- ============================================================
-- DIAGNOSTIC QUERIES
-- ============================================================

-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';

-- 3. Check RPC functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 5. Check prize pool
SELECT ppv.name, ppv.status, COUNT(p.id) AS prize_count
FROM public.prize_pool_versions ppv
LEFT JOIN public.prizes p ON p.pool_version_id = ppv.id
GROUP BY ppv.id, ppv.name, ppv.status;

-- 6. Check prizes and weights
SELECT name, type, weight, active, total_available, given_count
FROM public.prizes
ORDER BY weight DESC;

-- ============================================================
-- MANUAL TEST STEPS (Run after creating users via Auth)
-- ============================================================

/*
STEP 1: Create a test user via Supabase Auth (email/password or OAuth)
        The handle_new_user trigger should auto-create a profile.

STEP 2: Verify profile was created:
*/
-- SELECT * FROM public.profiles LIMIT 10;

/*
STEP 3: Make a user staff (replace with actual user ID):
*/
-- UPDATE public.profiles SET role = 'staff' WHERE email = 'staff@test.com';

/*
STEP 4: As staff, test finding a customer (replace with actual public_id):
*/
-- SELECT public.rpc_staff_find_user_by_public_id('OS-XXXX');

/*
STEP 5: As staff, add points to customer:
*/
-- SELECT public.rpc_staff_add_points('OS-XXXX', 5000, 'Test bill $50');

/*
STEP 6: As staff, add spins to customer:
*/
-- SELECT public.rpc_staff_add_spins('OS-XXXX', 3, 'Welcome bonus');

/*
STEP 7: As customer, get own profile:
*/
-- SELECT public.rpc_get_my_profile();

/*
STEP 8: As customer, spin wheel:
*/
-- SELECT public.rpc_spin();

/*
STEP 9: Check ledger for transactions:
*/
-- SELECT * FROM public.ledger ORDER BY created_at DESC LIMIT 20;

/*
STEP 10: Check coupons generated:
*/
-- SELECT c.*, p.name AS prize_name 
-- FROM public.coupons c 
-- JOIN public.prizes p ON p.id = c.prize_id
-- ORDER BY c.created_at DESC;

/*
STEP 11: As staff, redeem a coupon:
*/
-- SELECT public.rpc_staff_redeem_coupon('WIN-XXXXXXXX');

/*
STEP 12: As customer, convert points to spins:
*/
-- SELECT public.rpc_convert_points_to_spins(2);

-- ============================================================
-- EXPECTED RESULTS
-- ============================================================
/*
| Test                        | Expected                                    |
|-----------------------------|---------------------------------------------|
| New user signup             | Profile auto-created with OS-XXXX public_id |
| rpc_staff_find_user         | Returns profile with found=true             |
| rpc_staff_add_points        | status=success, points increased            |
| rpc_staff_add_spins         | status=success, spins increased             |
| rpc_spin                    | ok=true, outcome=WIN or NO_WIN              |
| rpc_staff_redeem_coupon     | success=true if coupon valid                |
| rpc_convert_points_to_spins | success=true if enough points               |
| Customer view own profile   | Returns full profile JSON                   |
| Customer view other profile | RLS blocks (empty result)                   |
| Staff view any profile      | Allowed via RLS policy                      |
*/

SELECT 'Smoke test queries ready. Run the commented sections manually.' AS status;
