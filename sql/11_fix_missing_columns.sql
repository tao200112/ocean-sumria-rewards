
-- Fix missing columns that are causing API 500 errors

-- 1. Add avatar_url to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Add display_weight to prizes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prizes' AND column_name = 'display_weight') THEN
        ALTER TABLE public.prizes ADD COLUMN display_weight INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Update existing prizes to have display_weight = weight if it is 0/null
UPDATE public.prizes SET display_weight = weight WHERE display_weight IS NULL OR display_weight = 0;

SELECT 'Schema updated successfully' as result;
