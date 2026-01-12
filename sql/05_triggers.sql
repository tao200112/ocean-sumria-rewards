-- ============================================================
-- 05_triggers.sql - Database triggers
-- ============================================================

-- A) GENERATE UNIQUE PUBLIC_ID
-- Format: OS-XXXX (4 uppercase alphanumeric characters)
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate OS- followed by 4 random uppercase alphanumeric chars
        new_id := 'OS-' || UPPER(SUBSTRING(ENCODE(gen_random_bytes(3), 'hex') FROM 1 FOR 4));
        
        -- Check uniqueness
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE public_id = new_id) INTO exists_check;
        
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- B) AUTO-UPDATE updated_at TIMESTAMP
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- C) AUTO-CREATE PROFILE ON AUTH.USERS INSERT
-- SECURITY DEFINER allows this to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_public_id TEXT;
BEGIN
    -- Generate unique public_id
    new_public_id := public.generate_public_id();
    
    -- Insert new profile
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        public_id,
        points,
        spins
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        'customer',
        new_public_id,
        0,
        0
    );
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists (race condition), ignore
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail auth
        RAISE WARNING 'handle_new_user failed: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Drop and recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

SELECT 'Triggers created.' AS status;
