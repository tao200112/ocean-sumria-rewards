-- Fix Infinite Recursion in Profiles RLS
-- The previous policies caused a loop because checking if a user is 'admin' required reading the profiles table, which triggered the RLS again.

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Staff can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Customers can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own metadata" ON public.profiles;

-- 2. Create a Security Definer function to fetch role without hitting RLS
-- This function runs with the privileges of the creator (superuser/service_role)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- 3. Re-create Policies

-- A) READ: Users can read their own profile
CREATE POLICY "Read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- B) READ: Staff and Admins can read ALL profiles
CREATE POLICY "Staff/Admin read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.get_my_role() IN ('staff', 'admin')
);

-- C) INSERT: Users can create their own profile (for new signups)
CREATE POLICY "Insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- D) UPDATE: Users can update their own profile (basic fields)
CREATE POLICY "Update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);
