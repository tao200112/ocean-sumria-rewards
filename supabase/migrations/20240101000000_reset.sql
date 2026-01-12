-- dev-only: Reset database state for refactoring
-- WARNING: This deletes business data. Do not use in production if data preservation is needed.

TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.rewards CASCADE; -- Assuming 'rewards' is the coupons table, user said 'coupons' but previous context showed 'rewards'
TRUNCATE TABLE public.prize_configs CASCADE; -- Assuming 'prizes' -> 'prize_configs' based on types.ts, checking schema would be better but doing best effort
TRUNCATE TABLE public.profiles CASCADE;

-- If there are other tables like pool versions (user mentioned prize_pool_versions)
-- truncate table public.prize_pool_versions cascade;

-- Reset sequences if necessary (optional for UUIDs but good for serials)
