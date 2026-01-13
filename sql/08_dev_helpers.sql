-- ============================================================
-- 08_dev_helpers.sql
-- Development helpers to fix permissions and test features
-- ============================================================

-- Function 1: Promote current user to Staff (Dev Only)
-- This allows you to test the Staff App features
CREATE OR REPLACE FUNCTION public.rpc_become_staff() 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
    uid UUID;
BEGIN
    uid := auth.uid();
    IF uid IS NULL THEN 
        RETURN jsonb_build_object('success', FALSE, 'message', 'Not authenticated'); 
    END IF;

    UPDATE public.profiles 
    SET role = 'staff' 
    WHERE id = uid;

    RETURN jsonb_build_object('success', TRUE, 'message', 'Promoted to Staff');
END;
$$;
