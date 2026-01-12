-- Core Profiles Schema & Triggers & RLS
-- 1. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- 2. TABLE STRUCTURE
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    email text,
    name text,
    role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
    public_id text unique,
    points int default 0,
    spins int default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. HELPER FUNCTION: GENERATE PUBLIC ID
create or replace function public.generate_public_id()
returns text
language plpgsql
as $$
declare
  new_id text;
  exists_id boolean;
begin
  loop
    -- Generate OS-XXXX (4 random hex/alphanumeric upper)
    new_id := 'OS-' || upper(substring(encode(gen_random_bytes(3), 'hex'), 1, 4));
    -- Check uniqueness
    select exists(select 1 from public.profiles where public_id = new_id) into exists_id;
    exit when not exists_id;
  end loop;
  return new_id;
end;
$$;

-- 4. TRIGGER: BEFORE INSERT (Ensure Defaults)
create or replace function public.handle_profiles_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.public_id is null then
    new.public_id := public.generate_public_id();
  end if;
  if new.role is null then
    new.role := 'customer';
  end if;
  -- Force lowercase role
  new.role := lower(new.role);
  -- Force defaults
  if new.points is null then new.points := 0; end if;
  if new.spins is null then new.spins := 0; end if;
  return new;
end;
$$;

create trigger on_profiles_before_insert
before insert on public.profiles
for each row execute procedure public.handle_profiles_defaults();

-- 5. TRIGGER: AFTER AUTH USER CREATED (Auto Create Profile)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'customer' -- Default role
  );
  return new;
end;
$$;

-- Drop trigger if strictly recreating, or create if not exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 6. RLS
alter table public.profiles enable row level security;

-- Clean old policies
do $$
declare pol record;
begin
    for pol in select policyname, tablename from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
        execute format('drop policy "%s" on public.%s', pol.policyname, pol.tablename);
    end loop;
end $$;

-- Policy A: View Own Profile
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ( id = auth.uid() );

-- Policy B: Update Own Identity (Name only)
-- We REVOKE update explicitly below, but this policy allows it IF granted.
create policy "Users can update own name"
on public.profiles for update
to authenticated
using ( id = auth.uid() )
with check ( id = auth.uid() );

-- 7. PERMISSIONS LOCKDOWN
-- Revoke all direct modification from authenticated, except specific columns if supported or strict via simple revoke
revoke insert, delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
-- Allow update ONLY on name/avatarUrl if those exist.
grant update (name, email) on public.profiles to authenticated;

-- Staff/Admins cannot Read All via RLS directly (To prevent recursion/complex logic).
-- They must use RPCs.
