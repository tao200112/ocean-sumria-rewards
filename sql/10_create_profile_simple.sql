-- ============================================================
-- 10_create_profile_simple.sql  
-- 创建简化的 profile 创建函数（完全避免查询 auth.users）
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_profile_simple(
    p_user_id UUID,
    p_email TEXT,
    p_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_public_id TEXT;
    result JSONB;
BEGIN
    -- 检查 profile 是否已存在
    IF EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
        -- 已存在，返回现有 profile
        SELECT jsonb_build_object(
            'id', p.id,
            'public_id', p.public_id,
            'name', p.name,
            'email', p.email,
            'role', p.role,
            'points', p.points,
            'spins', p.spins
        ) INTO result
        FROM public.profiles p
        WHERE p.id = p_user_id;
        
        RETURN result;
    END IF;
    
    -- 生成 public_id
    new_public_id := public.generate_public_id();
    
    -- 创建 profile
    INSERT INTO public.profiles (id, email, name, role, public_id, points, spins)
    VALUES (p_user_id, p_email, p_name, 'customer', new_public_id, 0, 0);
    
    -- 同步到角色缓存表
    INSERT INTO public.user_roles_cache (user_id, role)
    VALUES (p_user_id, 'customer')
    ON CONFLICT (user_id) DO UPDATE SET role = 'customer';
    
    -- 返回新创建的 profile
    SELECT jsonb_build_object(
        'id', p.id,
        'public_id', p.public_id,
        'name', p.name,
        'email', p.email,
        'role', p.role,
        'points', p.points,
        'spins', p.spins
    ) INTO result
    FROM public.profiles p
    WHERE p.id = p_user_id;
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        -- 并发竞争条件：已被其他请求创建
        SELECT jsonb_build_object(
            'id', p.id,
            'public_id', p.public_id,
            'name', p.name,
            'email', p.email,
            'role', p.role,
            'points', p.points,
            'spins', p.spins
        ) INTO result
        FROM public.profiles p
        WHERE p.id = p_user_id;
        
        RETURN result;
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', 'CREATE_FAILED', 'message', SQLERRM);
END;
$$;

SELECT '✅ 简化 Profile 创建函数已就绪' AS status;
