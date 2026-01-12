-- ============================================================
-- 08_seed.sql - Sample data for testing
-- ============================================================

-- A) Create a published prize pool
INSERT INTO public.prize_pool_versions (id, status, name, published_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'published', 'Launch Pool 2024', NOW())
ON CONFLICT DO NOTHING;

-- B) Create prizes in the pool
INSERT INTO public.prizes (id, pool_version_id, name, description, type, weight, active, total_available, win_limit_per_user, icon, value_description)
VALUES 
    -- High probability: 10% discount
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
     '10% Off', 'Get 10% off your next bill', 'discount', 50, TRUE, NULL, NULL, 'local_offer', '10% Off'),
    
    -- Medium probability: Free appetizer
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
     'Free Appetizer', 'Any appetizer on the house', 'free_item', 25, TRUE, 100, 2, 'restaurant', 'Free Appetizer'),
    
    -- Low probability: Free entree
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 
     'Free Entree', 'Any entree up to $25 value', 'free_item', 10, TRUE, 20, 1, 'dinner_dining', 'Free Entree'),
    
    -- Rare: BOGO
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 
     'Buy One Get One', 'BOGO on any menu item', 'bogo', 5, TRUE, 10, 1, 'celebration', 'BOGO'),
    
    -- No-win slot (for "try again" outcomes)
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 
     'Try Again', 'Better luck next time!', 'no_win', 30, TRUE, NULL, NULL, 'refresh', 'No Prize'),
    
    -- Bonus points prize
    ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 
     '50 Bonus Points', 'Instant 50 points added', 'points_bonus', 15, TRUE, NULL, NULL, 'stars', '50 Points')
ON CONFLICT DO NOTHING;

-- C) Note: Real staff/admin users must be created through Supabase Auth
-- Then update their role in profiles table:
-- UPDATE public.profiles SET role = 'staff' WHERE email = 'staff@yourdomain.com';
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';

SELECT 'Seed data inserted.' AS status;
SELECT 'Prize Pool Created:' AS info, COUNT(*) AS prize_count FROM public.prizes WHERE pool_version_id = '00000000-0000-0000-0000-000000000001';
