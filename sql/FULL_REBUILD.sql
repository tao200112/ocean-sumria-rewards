-- ============================================================
-- QUICK FULL REBUILD SCRIPT
-- Copy this entire file into Supabase SQL Editor to reset and rebuild
-- ============================================================

-- WARNING: This will DELETE ALL DATA in public schema!

-- ============================================================
-- STEP 0: RESET (Drop everything)
-- ============================================================
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.prizes CASCADE;
DROP TABLE IF EXISTS public.prize_pool_versions CASCADE;
DROP TABLE IF EXISTS public.ledger CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.generate_public_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_my_profile() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_find_user_by_public_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_add_points(text, int, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_add_spins(text, int, text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_spin() CASCADE;
DROP FUNCTION IF EXISTS public.rpc_staff_redeem_coupon(text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_convert_points_to_spins(int) CASCADE;

-- ============================================================
-- STEP 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- STEP 2: TABLES
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'manager', 'admin')),
    public_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    spins INTEGER NOT NULL DEFAULT 0 CHECK (spins >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    delta_points INTEGER NOT NULL DEFAULT 0,
    delta_spins INTEGER NOT NULL DEFAULT 0,
    balance_points INTEGER,
    balance_spins INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.prize_pool_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    name TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_version_id UUID NOT NULL REFERENCES public.prize_pool_versions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'discount',
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    total_available INTEGER,
    given_count INTEGER NOT NULL DEFAULT 0,
    win_limit_per_user INTEGER,
    icon TEXT,
    color TEXT,
    value_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES public.prizes(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    expires_at TIMESTAMPTZ,
    redeemed_at TIMESTAMPTZ,
    redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STEP 3: INDEXES
-- ============================================================
CREATE INDEX idx_profiles_public_id ON public.profiles(public_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_ledger_user_id ON public.ledger(user_id);
CREATE INDEX idx_ledger_created_at ON public.ledger(created_at DESC);
CREATE INDEX idx_prizes_pool_version ON public.prizes(pool_version_id);
CREATE INDEX idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);

-- ============================================================
-- STEP 4: TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE new_id TEXT; exists_check BOOLEAN;
BEGIN
    LOOP
        new_id := 'OS-' || UPPER(SUBSTRING(ENCODE(gen_random_bytes(3), 'hex') FROM 1 FOR 4));
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE public_id = new_id) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_public_id TEXT;
BEGIN
    new_public_id := public.generate_public_id();
    INSERT INTO public.profiles (id, email, name, role, public_id, points, spins)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)), 'customer', new_public_id, 0, 0);
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user: %', SQLERRM; RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STEP 5: RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pool_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users view own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Staff view all" ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'manager', 'admin')));
CREATE POLICY "Users update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Ledger policies
CREATE POLICY "Users view own ledger" ON public.ledger FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff view all ledger" ON public.ledger FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'manager', 'admin')));

-- Prize policies
CREATE POLICY "View published prizes" ON public.prizes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.prize_pool_versions ppv WHERE ppv.id = pool_version_id AND ppv.status = 'published'));
CREATE POLICY "Staff view all prizes" ON public.prizes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'manager', 'admin')));

-- Pool policies
CREATE POLICY "View published pools" ON public.prize_pool_versions FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "Staff view all pools" ON public.prize_pool_versions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'manager', 'admin')));

-- Coupon policies
CREATE POLICY "Users view own coupons" ON public.coupons FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff view all coupons" ON public.coupons FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'manager', 'admin')));

-- ============================================================
-- STEP 6: RPCs (Abbreviated - full versions in 07_rpc_functions.sql)
-- ============================================================

-- rpc_get_my_profile
CREATE OR REPLACE FUNCTION public.rpc_get_my_profile() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSONB;
BEGIN
    SELECT jsonb_build_object('id', p.id, 'public_id', p.public_id, 'name', p.name, 'email', p.email, 'role', p.role, 'points', p.points, 'spins', p.spins) INTO result FROM public.profiles p WHERE p.id = auth.uid();
    IF result IS NULL THEN RETURN jsonb_build_object('error', 'PROFILE_NOT_FOUND'); END IF;
    RETURN result;
END;
$$;

-- rpc_staff_find_user_by_public_id
CREATE OR REPLACE FUNCTION public.rpc_staff_find_user_by_public_id(p_public_id TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller_role TEXT; result JSONB;
BEGIN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role NOT IN ('staff', 'manager', 'admin') THEN RETURN jsonb_build_object('error', 'UNAUTHORIZED'); END IF;
    SELECT jsonb_build_object('found', TRUE, 'profile', jsonb_build_object('id', p.id, 'public_id', p.public_id, 'name', p.name, 'email', p.email, 'points', p.points, 'spins', p.spins)) INTO result FROM public.profiles p WHERE UPPER(TRIM(p.public_id)) = UPPER(TRIM(p_public_id));
    IF result IS NULL THEN RETURN jsonb_build_object('found', FALSE); END IF;
    RETURN result;
END;
$$;

-- rpc_staff_add_points
CREATE OR REPLACE FUNCTION public.rpc_staff_add_points(p_public_id TEXT, p_usd_cents INTEGER, p_note TEXT DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller_role TEXT; caller_id UUID; target_id UUID; pts INTEGER; new_pts INTEGER; new_spins INTEGER;
BEGIN
    SELECT id, role INTO caller_id, caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role NOT IN ('staff', 'manager', 'admin') THEN RETURN jsonb_build_object('status', 'error', 'code', 'UNAUTHORIZED'); END IF;
    pts := FLOOR(p_usd_cents / 100);
    IF pts <= 0 THEN RETURN jsonb_build_object('status', 'error', 'code', 'INVALID_AMOUNT'); END IF;
    SELECT id INTO target_id FROM public.profiles WHERE UPPER(TRIM(public_id)) = UPPER(TRIM(p_public_id));
    IF target_id IS NULL THEN RETURN jsonb_build_object('status', 'error', 'code', 'USER_NOT_FOUND'); END IF;
    UPDATE public.profiles SET points = points + pts WHERE id = target_id RETURNING points, spins INTO new_pts, new_spins;
    INSERT INTO public.ledger (user_id, actor_id, type, delta_points, balance_points, balance_spins, metadata) VALUES (target_id, caller_id, 'earn_points', pts, new_pts, new_spins, jsonb_build_object('usd_cents', p_usd_cents, 'note', p_note));
    RETURN jsonb_build_object('status', 'success', 'points_added', pts, 'new_points', new_pts, 'new_spins', new_spins);
END;
$$;

-- rpc_staff_add_spins
CREATE OR REPLACE FUNCTION public.rpc_staff_add_spins(p_public_id TEXT, p_spins INTEGER, p_note TEXT DEFAULT NULL) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller_role TEXT; caller_id UUID; target_id UUID; new_pts INTEGER; new_spins INTEGER;
BEGIN
    SELECT id, role INTO caller_id, caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role NOT IN ('staff', 'manager', 'admin') THEN RETURN jsonb_build_object('status', 'error', 'code', 'UNAUTHORIZED'); END IF;
    IF p_spins <= 0 THEN RETURN jsonb_build_object('status', 'error', 'code', 'INVALID_AMOUNT'); END IF;
    SELECT id INTO target_id FROM public.profiles WHERE UPPER(TRIM(public_id)) = UPPER(TRIM(p_public_id));
    IF target_id IS NULL THEN RETURN jsonb_build_object('status', 'error', 'code', 'USER_NOT_FOUND'); END IF;
    UPDATE public.profiles SET spins = spins + p_spins WHERE id = target_id RETURNING points, spins INTO new_pts, new_spins;
    INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata) VALUES (target_id, caller_id, 'earn_spins', p_spins, new_pts, new_spins, jsonb_build_object('note', p_note));
    RETURN jsonb_build_object('status', 'success', 'spins_added', p_spins, 'new_points', new_pts, 'new_spins', new_spins);
END;
$$;

-- rpc_spin (simplified)
CREATE OR REPLACE FUNCTION public.rpc_spin() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID; user_spins INTEGER; user_points INTEGER; pool_id UUID; selected_prize RECORD; total_weight INTEGER; rand_val INTEGER; cum_weight INTEGER := 0; coupon_code TEXT;
BEGIN
    uid := auth.uid();
    SELECT spins, points INTO user_spins, user_points FROM public.profiles WHERE id = uid FOR UPDATE;
    IF user_spins IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'USER_NOT_FOUND'); END IF;
    IF user_spins < 1 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'NO_SPINS'); END IF;
    SELECT id INTO pool_id FROM public.prize_pool_versions WHERE status = 'published' ORDER BY published_at DESC NULLS LAST LIMIT 1;
    IF pool_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'NO_POOL'); END IF;
    UPDATE public.profiles SET spins = spins - 1 WHERE id = uid RETURNING spins INTO user_spins;
    SELECT SUM(weight) INTO total_weight FROM public.prizes WHERE pool_version_id = pool_id AND active = TRUE AND (total_available IS NULL OR given_count < total_available);
    IF total_weight IS NULL OR total_weight = 0 THEN
        INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata) VALUES (uid, uid, 'spend_spins', -1, user_points, user_spins, '{"outcome":"no_prizes"}');
        RETURN jsonb_build_object('ok', TRUE, 'outcome', 'NO_WIN', 'spins', user_spins, 'points', user_points);
    END IF;
    rand_val := FLOOR(RANDOM() * total_weight);
    FOR selected_prize IN SELECT * FROM public.prizes WHERE pool_version_id = pool_id AND active = TRUE AND (total_available IS NULL OR given_count < total_available) ORDER BY id LOOP
        cum_weight := cum_weight + selected_prize.weight;
        IF rand_val < cum_weight THEN
            IF selected_prize.type = 'no_win' THEN
                INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata) VALUES (uid, uid, 'spend_spins', -1, user_points, user_spins, '{"outcome":"NO_WIN"}');
                RETURN jsonb_build_object('ok', TRUE, 'outcome', 'NO_WIN', 'spins', user_spins, 'points', user_points);
            END IF;
            coupon_code := 'WIN-' || UPPER(SUBSTRING(ENCODE(gen_random_bytes(4), 'hex') FROM 1 FOR 8));
            INSERT INTO public.coupons (user_id, prize_id, code, status, expires_at) VALUES (uid, selected_prize.id, coupon_code, 'active', NOW() + INTERVAL '7 days');
            UPDATE public.prizes SET given_count = given_count + 1 WHERE id = selected_prize.id;
            INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata) VALUES (uid, uid, 'spend_spins', -1, user_points, user_spins, jsonb_build_object('outcome', 'WIN', 'prize', selected_prize.name, 'code', coupon_code));
            RETURN jsonb_build_object('ok', TRUE, 'outcome', 'WIN', 'prize', jsonb_build_object('name', selected_prize.name, 'type', selected_prize.type, 'value', selected_prize.value_description), 'coupon_code', coupon_code, 'spins', user_spins, 'points', user_points);
        END IF;
    END LOOP;
    INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata) VALUES (uid, uid, 'spend_spins', -1, user_points, user_spins, '{"outcome":"NO_WIN"}');
    RETURN jsonb_build_object('ok', TRUE, 'outcome', 'NO_WIN', 'spins', user_spins, 'points', user_points);
END;
$$;

-- rpc_staff_redeem_coupon
CREATE OR REPLACE FUNCTION public.rpc_staff_redeem_coupon(p_code TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller_role TEXT; caller_id UUID; coupon_rec RECORD;
BEGIN
    SELECT id, role INTO caller_id, caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role NOT IN ('staff', 'manager', 'admin') THEN RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED'); END IF;
    SELECT c.*, p.name AS prize_name INTO coupon_rec FROM public.coupons c JOIN public.prizes p ON p.id = c.prize_id WHERE UPPER(TRIM(c.code)) = UPPER(TRIM(p_code)) FOR UPDATE OF c;
    IF coupon_rec.id IS NULL THEN RETURN jsonb_build_object('success', FALSE, 'error', 'NOT_FOUND'); END IF;
    IF coupon_rec.status = 'redeemed' THEN RETURN jsonb_build_object('success', FALSE, 'error', 'ALREADY_REDEEMED'); END IF;
    IF coupon_rec.expires_at < NOW() THEN UPDATE public.coupons SET status = 'expired' WHERE id = coupon_rec.id; RETURN jsonb_build_object('success', FALSE, 'error', 'EXPIRED'); END IF;
    UPDATE public.coupons SET status = 'redeemed', redeemed_at = NOW(), redeemed_by = caller_id WHERE id = coupon_rec.id;
    INSERT INTO public.ledger (user_id, actor_id, type, metadata) VALUES (coupon_rec.user_id, caller_id, 'redeem_prize', jsonb_build_object('code', p_code, 'prize', coupon_rec.prize_name));
    RETURN jsonb_build_object('success', TRUE, 'prize_name', coupon_rec.prize_name);
END;
$$;

-- rpc_convert_points_to_spins
CREATE OR REPLACE FUNCTION public.rpc_convert_points_to_spins(p_spin_count INTEGER) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID; cost INTEGER; cur_pts INTEGER; new_pts INTEGER; new_spins INTEGER;
BEGIN
    uid := auth.uid(); cost := p_spin_count * 100;
    IF p_spin_count <= 0 THEN RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_AMOUNT'); END IF;
    SELECT points INTO cur_pts FROM public.profiles WHERE id = uid FOR UPDATE;
    IF cur_pts IS NULL THEN RETURN jsonb_build_object('success', FALSE, 'error', 'USER_NOT_FOUND'); END IF;
    IF cur_pts < cost THEN RETURN jsonb_build_object('success', FALSE, 'error', 'INSUFFICIENT_POINTS'); END IF;
    UPDATE public.profiles SET points = points - cost, spins = spins + p_spin_count WHERE id = uid RETURNING points, spins INTO new_pts, new_spins;
    INSERT INTO public.ledger (user_id, actor_id, type, delta_points, delta_spins, balance_points, balance_spins, metadata) VALUES (uid, uid, 'convert_points', -cost, p_spin_count, new_pts, new_spins, jsonb_build_object('spins', p_spin_count, 'cost', cost));
    RETURN jsonb_build_object('success', TRUE, 'spins_added', p_spin_count, 'points_spent', cost, 'new_points', new_pts, 'new_spins', new_spins);
END;
$$;

-- ============================================================
-- STEP 7: SEED DATA
-- ============================================================
INSERT INTO public.prize_pool_versions (id, status, name, published_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'published', 'Launch Pool', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.prizes (pool_version_id, name, type, weight, active, icon, value_description) VALUES
('00000000-0000-0000-0000-000000000001', '10% Off', 'discount', 50, TRUE, 'local_offer', '10% Off'),
('00000000-0000-0000-0000-000000000001', 'Free Appetizer', 'free_item', 25, TRUE, 'restaurant', 'Free App'),
('00000000-0000-0000-0000-000000000001', 'Free Entree', 'free_item', 10, TRUE, 'dinner_dining', 'Free Entree'),
('00000000-0000-0000-0000-000000000001', 'BOGO', 'bogo', 5, TRUE, 'celebration', 'BOGO'),
('00000000-0000-0000-0000-000000000001', 'Try Again', 'no_win', 30, TRUE, 'refresh', 'No Prize'),
('00000000-0000-0000-0000-000000000001', '50 Points', 'points_bonus', 15, TRUE, 'stars', '+50 Points')
ON CONFLICT DO NOTHING;

SELECT 'Database rebuild complete!' AS status;
SELECT COUNT(*) AS profile_count FROM public.profiles;
SELECT COUNT(*) AS prize_count FROM public.prizes;
