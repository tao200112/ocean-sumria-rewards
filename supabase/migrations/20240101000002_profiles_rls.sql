-- Enable RLS
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON "profiles"
FOR SELECT
TO authenticated
USING ( (select auth.uid()) = id );

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON "profiles"
FOR INSERT
TO authenticated
WITH CHECK ( (select auth.uid()) = id );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON "profiles"
FOR UPDATE
TO authenticated
USING ( (select auth.uid()) = id );

-- Allow service role full access (implicitly enabled, but good to note)
-- Explicit Service Role policy usually not needed if using service_role key, 
-- but ensuring logic works for RPCs might require specific functions using security definer.
