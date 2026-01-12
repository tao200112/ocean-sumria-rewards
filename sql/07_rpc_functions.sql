-- ============================================================
-- 07_rpc_functions.sql - Business logic RPCs
-- All use SECURITY DEFINER to bypass RLS for authorized operations
-- ============================================================

-- ============================================================
-- 0) rpc_ensure_profile()
-- Creates a profile for the current user if one doesn't exist.
-- This is a fallback for when the auth.users trigger fails (e.g., OAuth).
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_ensure_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    user_email TEXT;
    user_name TEXT;
    new_public_id TEXT;
    profile_exists BOOLEAN;
    result JSONB;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'NOT_AUTHENTICATED', 'message', 'User not authenticated');
    END IF;
    
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
    
    IF profile_exists THEN
        -- Profile exists, return it
        SELECT jsonb_build_object(
            'created', FALSE,
            'id', p.id,
            'public_id', p.public_id,
            'name', p.name,
            'email', p.email,
            'role', p.role,
            'points', p.points,
            'spins', p.spins,
            'created_at', p.created_at
        ) INTO result
        FROM public.profiles p
        WHERE p.id = user_id;
        
        RETURN result;
    END IF;
    
    -- Profile doesn't exist, get user info from auth.users
    SELECT email, 
           COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1))
    INTO user_email, user_name
    FROM auth.users
    WHERE id = user_id;
    
    IF user_email IS NULL THEN
        RETURN jsonb_build_object('error', 'USER_NOT_FOUND', 'message', 'Auth user not found');
    END IF;
    
    -- Generate unique public_id
    new_public_id := public.generate_public_id();
    
    -- Create profile
    INSERT INTO public.profiles (id, email, name, role, public_id, points, spins)
    VALUES (user_id, user_email, user_name, 'customer', new_public_id, 0, 0);
    
    -- Return the newly created profile
    SELECT jsonb_build_object(
        'created', TRUE,
        'id', p.id,
        'public_id', p.public_id,
        'name', p.name,
        'email', p.email,
        'role', p.role,
        'points', p.points,
        'spins', p.spins,
        'created_at', p.created_at
    ) INTO result
    FROM public.profiles p
    WHERE p.id = user_id;
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Race condition: profile was created by another request
        SELECT jsonb_build_object(
            'created', FALSE,
            'id', p.id,
            'public_id', p.public_id,
            'name', p.name,
            'email', p.email,
            'role', p.role,
            'points', p.points,
            'spins', p.spins,
            'created_at', p.created_at
        ) INTO result
        FROM public.profiles p
        WHERE p.id = user_id;
        
        RETURN result;
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', 'CREATE_FAILED', 'message', SQLERRM);
END;
$$;

-- ============================================================
-- 1) rpc_get_my_profile()
-- Returns the current user's profile
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'public_id', p.public_id,
        'name', p.name,
        'email', p.email,
        'role', p.role,
        'points', p.points,
        'spins', p.spins,
        'created_at', p.created_at
    ) INTO result
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    IF result IS NULL THEN
        RETURN jsonb_build_object('error', 'PROFILE_NOT_FOUND', 'message', 'Profile not found');
    END IF;
    
    RETURN result;
END;
$$;

-- ============================================================
-- 2) rpc_staff_find_user_by_public_id(public_id TEXT)
-- Staff scans QR code to look up customer
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_staff_find_user_by_public_id(p_public_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
    result JSONB;
BEGIN
    -- 1. Auth check: caller must be staff/manager/admin
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IS NULL OR caller_role NOT IN ('staff', 'manager', 'admin') THEN
        RETURN jsonb_build_object('error', 'UNAUTHORIZED', 'message', 'Staff access required');
    END IF;
    
    -- 2. Find user by public_id (case-insensitive, trimmed)
    SELECT jsonb_build_object(
        'found', TRUE,
        'profile', jsonb_build_object(
            'id', p.id,
            'public_id', p.public_id,
            'name', p.name,
            'email', p.email,
            'role', p.role,
            'points', p.points,
            'spins', p.spins
        )
    ) INTO result
    FROM public.profiles p
    WHERE UPPER(TRIM(p.public_id)) = UPPER(TRIM(p_public_id))
    LIMIT 1;
    
    IF result IS NULL THEN
        RETURN jsonb_build_object('found', FALSE, 'message', 'Customer not found');
    END IF;
    
    RETURN result;
END;
$$;

-- ============================================================
-- 3) rpc_staff_add_points(public_id TEXT, usd_cents INT, note TEXT)
-- Staff adds points to customer: $1 = 1 point
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_staff_add_points(
    p_public_id TEXT,
    p_usd_cents INTEGER,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
    caller_id UUID;
    target_id UUID;
    points_to_add INTEGER;
    new_points INTEGER;
    new_spins INTEGER;
BEGIN
    -- 1. Auth check
    SELECT id, role INTO caller_id, caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IS NULL OR caller_role NOT IN ('staff', 'manager', 'admin') THEN
        RETURN jsonb_build_object('status', 'error', 'code', 'UNAUTHORIZED', 'message', 'Staff access required');
    END IF;
    
    -- 2. Calculate points (1 point per $1)
    points_to_add := FLOOR(p_usd_cents / 100);
    
    IF points_to_add <= 0 THEN
        RETURN jsonb_build_object('status', 'error', 'code', 'INVALID_AMOUNT', 'message', 'Amount must be at least $1');
    END IF;
    
    -- 3. Find target user
    SELECT id INTO target_id 
    FROM public.profiles 
    WHERE UPPER(TRIM(public_id)) = UPPER(TRIM(p_public_id));
    
    IF target_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'code', 'USER_NOT_FOUND', 'message', 'Customer not found');
    END IF;
    
    -- 4. Update points (with row lock to prevent race)
    UPDATE public.profiles
    SET points = points + points_to_add
    WHERE id = target_id
    RETURNING points, spins INTO new_points, new_spins;
    
    -- 5. Record in ledger
    INSERT INTO public.ledger (user_id, actor_id, type, delta_points, balance_points, balance_spins, metadata)
    VALUES (
        target_id, 
        caller_id, 
        'earn_points', 
        points_to_add, 
        new_points, 
        new_spins,
        jsonb_build_object('usd_cents', p_usd_cents, 'note', p_note)
    );
    
    RETURN jsonb_build_object(
        'status', 'success',
        'points_added', points_to_add,
        'new_points', new_points,
        'new_spins', new_spins
    );
END;
$$;

-- ============================================================
-- 4) rpc_staff_add_spins(public_id TEXT, spins INT, note TEXT)
-- Staff grants free spins to customer
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_staff_add_spins(
    p_public_id TEXT,
    p_spins INTEGER,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
    caller_id UUID;
    target_id UUID;
    new_points INTEGER;
    new_spins INTEGER;
BEGIN
    -- 1. Auth check
    SELECT id, role INTO caller_id, caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IS NULL OR caller_role NOT IN ('staff', 'manager', 'admin') THEN
        RETURN jsonb_build_object('status', 'error', 'code', 'UNAUTHORIZED', 'message', 'Staff access required');
    END IF;
    
    IF p_spins <= 0 THEN
        RETURN jsonb_build_object('status', 'error', 'code', 'INVALID_AMOUNT', 'message', 'Spins must be positive');
    END IF;
    
    -- 2. Find target user
    SELECT id INTO target_id 
    FROM public.profiles 
    WHERE UPPER(TRIM(public_id)) = UPPER(TRIM(p_public_id));
    
    IF target_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'code', 'USER_NOT_FOUND', 'message', 'Customer not found');
    END IF;
    
    -- 3. Update spins
    UPDATE public.profiles
    SET spins = spins + p_spins
    WHERE id = target_id
    RETURNING points, spins INTO new_points, new_spins;
    
    -- 4. Record in ledger
    INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata)
    VALUES (target_id, caller_id, 'earn_spins', p_spins, new_points, new_spins, jsonb_build_object('note', p_note));
    
    RETURN jsonb_build_object(
        'status', 'success',
        'spins_added', p_spins,
        'new_points', new_points,
        'new_spins', new_spins
    );
END;
$$;

-- ============================================================
-- 5) rpc_spin()
-- Customer spins the wheel, consumes 1 spin, wins prize
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_spin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    user_spins INTEGER;
    user_points INTEGER;
    pool_id UUID;
    selected_prize RECORD;
    total_weight INTEGER;
    random_value INTEGER;
    cumulative_weight INTEGER := 0;
    new_coupon_code TEXT;
    new_coupon_id UUID;
    user_win_count INTEGER;
BEGIN
    user_id := auth.uid();
    
    -- 1. Lock user row and check spins
    SELECT spins, points INTO user_spins, user_points
    FROM public.profiles
    WHERE id = user_id
    FOR UPDATE;
    
    IF user_spins IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'USER_NOT_FOUND', 'message', 'Profile not found');
    END IF;
    
    IF user_spins < 1 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'NO_SPINS', 'message', 'No spins available');
    END IF;
    
    -- 2. Get published pool
    SELECT id INTO pool_id
    FROM public.prize_pool_versions
    WHERE status = 'published'
    ORDER BY published_at DESC NULLS LAST
    LIMIT 1;
    
    IF pool_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'NO_POOL', 'message', 'No active prize pool');
    END IF;
    
    -- 3. Deduct spin first (optimistic)
    UPDATE public.profiles
    SET spins = spins - 1
    WHERE id = user_id
    RETURNING spins INTO user_spins;
    
    -- 4. Calculate prize selection
    -- Get available prizes (active, not exhausted, within user limit)
    SELECT SUM(weight) INTO total_weight
    FROM public.prizes
    WHERE pool_version_id = pool_id
      AND active = TRUE
      AND (total_available IS NULL OR given_count < total_available);
    
    IF total_weight IS NULL OR total_weight = 0 THEN
        -- No prizes available, log and return no-win
        INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata)
        VALUES (user_id, user_id, 'spend_spins', -1, user_points, user_spins, jsonb_build_object('outcome', 'no_prizes'));
        
        RETURN jsonb_build_object(
            'ok', TRUE,
            'outcome', 'NO_WIN',
            'message', 'No prizes available',
            'spins', user_spins,
            'points', user_points
        );
    END IF;
    
    -- Random selection
    random_value := FLOOR(RANDOM() * total_weight);
    
    FOR selected_prize IN
        SELECT *
        FROM public.prizes
        WHERE pool_version_id = pool_id
          AND active = TRUE
          AND (total_available IS NULL OR given_count < total_available)
        ORDER BY id  -- Deterministic order
    LOOP
        cumulative_weight := cumulative_weight + selected_prize.weight;
        
        IF random_value < cumulative_weight THEN
            -- Check win_limit_per_user if set
            IF selected_prize.win_limit_per_user IS NOT NULL THEN
                SELECT COUNT(*) INTO user_win_count
                FROM public.coupons
                WHERE prize_id = selected_prize.id AND coupons.user_id = rpc_spin.user_id;
                
                IF user_win_count >= selected_prize.win_limit_per_user THEN
                    -- User exceeded limit for this prize, continue to next
                    CONTINUE;
                END IF;
            END IF;
            
            -- Winner! Generate coupon
            new_coupon_code := 'WIN-' || UPPER(SUBSTRING(ENCODE(gen_random_bytes(4), 'hex') FROM 1 FOR 8));
            new_coupon_id := gen_random_uuid();
            
            -- Create coupon
            INSERT INTO public.coupons (id, user_id, prize_id, code, status, expires_at)
            VALUES (
                new_coupon_id,
                user_id,
                selected_prize.id,
                new_coupon_code,
                'active',
                NOW() + INTERVAL '7 days'
            );
            
            -- Increment prize given_count
            UPDATE public.prizes
            SET given_count = given_count + 1
            WHERE id = selected_prize.id;
            
            -- Log to ledger
            INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata)
            VALUES (user_id, user_id, 'spend_spins', -1, user_points, user_spins, 
                jsonb_build_object('outcome', 'WIN', 'prize_id', selected_prize.id, 'prize_name', selected_prize.name, 'coupon_code', new_coupon_code));
            
            RETURN jsonb_build_object(
                'ok', TRUE,
                'outcome', 'WIN',
                'prize', jsonb_build_object(
                    'id', selected_prize.id,
                    'name', selected_prize.name,
                    'type', selected_prize.type,
                    'value', selected_prize.value_description,
                    'icon', selected_prize.icon
                ),
                'coupon_code', new_coupon_code,
                'spins', user_spins,
                'points', user_points
            );
        END IF;
    END LOOP;
    
    -- If we get here, no prize was selected (edge case with limits)
    INSERT INTO public.ledger (user_id, actor_id, type, delta_spins, balance_points, balance_spins, metadata)
    VALUES (user_id, user_id, 'spend_spins', -1, user_points, user_spins, jsonb_build_object('outcome', 'NO_WIN'));
    
    RETURN jsonb_build_object(
        'ok', TRUE,
        'outcome', 'NO_WIN',
        'message', 'Better luck next time!',
        'spins', user_spins,
        'points', user_points
    );
END;
$$;

-- ============================================================
-- 6) rpc_staff_redeem_coupon(code TEXT)
-- Staff redeems a customer's coupon
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_staff_redeem_coupon(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
    caller_id UUID;
    coupon_record RECORD;
BEGIN
    -- 1. Auth check
    SELECT id, role INTO caller_id, caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF caller_role IS NULL OR caller_role NOT IN ('staff', 'manager', 'admin') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Staff access required');
    END IF;
    
    -- 2. Find and lock coupon
    SELECT c.*, p.name AS prize_name
    INTO coupon_record
    FROM public.coupons c
    JOIN public.prizes p ON p.id = c.prize_id
    WHERE UPPER(TRIM(c.code)) = UPPER(TRIM(p_code))
    FOR UPDATE OF c;
    
    IF coupon_record.id IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'NOT_FOUND', 'message', 'Coupon not found');
    END IF;
    
    IF coupon_record.status = 'redeemed' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'ALREADY_REDEEMED', 'message', 'Coupon already redeemed');
    END IF;
    
    IF coupon_record.status = 'expired' OR (coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < NOW()) THEN
        -- Mark as expired if not already
        UPDATE public.coupons SET status = 'expired' WHERE id = coupon_record.id;
        RETURN jsonb_build_object('success', FALSE, 'error', 'EXPIRED', 'message', 'Coupon has expired');
    END IF;
    
    -- 3. Redeem coupon
    UPDATE public.coupons
    SET status = 'redeemed',
        redeemed_at = NOW(),
        redeemed_by = caller_id
    WHERE id = coupon_record.id;
    
    -- 4. Log redemption
    INSERT INTO public.ledger (user_id, actor_id, type, metadata)
    VALUES (coupon_record.user_id, caller_id, 'redeem_prize', 
        jsonb_build_object('coupon_code', p_code, 'prize_name', coupon_record.prize_name));
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'prize_name', coupon_record.prize_name,
        'customer_id', coupon_record.user_id
    );
END;
$$;

-- ============================================================
-- 7) rpc_convert_points_to_spins(spin_count INT)
-- Customer converts points to spins (100 pts = 1 spin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_convert_points_to_spins(p_spin_count INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    points_cost INTEGER;
    current_points INTEGER;
    new_points INTEGER;
    new_spins INTEGER;
BEGIN
    user_id := auth.uid();
    points_cost := p_spin_count * 100;
    
    IF p_spin_count <= 0 THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_AMOUNT', 'message', 'Must convert at least 1 spin');
    END IF;
    
    -- Lock and check points
    SELECT points INTO current_points
    FROM public.profiles
    WHERE id = user_id
    FOR UPDATE;
    
    IF current_points IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'USER_NOT_FOUND', 'message', 'Profile not found');
    END IF;
    
    IF current_points < points_cost THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INSUFFICIENT_POINTS', 'message', 'Not enough points');
    END IF;
    
    -- Perform conversion
    UPDATE public.profiles
    SET points = points - points_cost,
        spins = spins + p_spin_count
    WHERE id = user_id
    RETURNING points, spins INTO new_points, new_spins;
    
    -- Log
    INSERT INTO public.ledger (user_id, actor_id, type, delta_points, delta_spins, balance_points, balance_spins, metadata)
    VALUES (user_id, user_id, 'convert_points', -points_cost, p_spin_count, new_points, new_spins, 
        jsonb_build_object('spins_purchased', p_spin_count, 'points_spent', points_cost));
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'spins_added', p_spin_count,
        'points_spent', points_cost,
        'new_points', new_points,
        'new_spins', new_spins
    );
END;
$$;

SELECT 'RPC functions created.' AS status;
