-- ============================================================
-- 10_better_search.sql
-- Improve Staff Search to support Email and ID
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
    -- Check permissions (using check_is_staff function if available, or manual check)
    -- We use standard query to be safe
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role IN ('staff', 'manager', 'admin')
    ) THEN 
        RETURN jsonb_build_object('found', FALSE, 'message', 'UNAUTHORIZED'); 
    END IF;

    -- Search by Public ID OR Email
    SELECT jsonb_build_object(
        'found', TRUE, 
        'profile', jsonb_build_object(
            'id', p.id, 
            'public_id', p.public_id, 
            'name', p.name, 
            'email', p.email, 
            'points', p.points, 
            'spins', p.spins,
            'role', p.role
        )
    ) INTO result
    FROM public.profiles p
    WHERE 
        UPPER(TRIM(p.public_id)) = UPPER(TRIM(p_public_id))
        OR
        UPPER(p.email) = UPPER(TRIM(p_public_id));

    IF result IS NULL THEN 
        RETURN jsonb_build_object('found', FALSE, 'message', 'User not found in database'); 
    END IF;

    RETURN result;
END;
$$;
