-- RPCs for Business Logic (Staff Actions, Customer Actions)

-- 1. Helper: Staff/Admin Check
-- Note: We avoid querying profiles table for role inside RLS, but inside Security Definer RPC it is safe.
-- Usage: Always perform strict role check first.

-- 2. Staff: Get Customer By Public ID
drop function if exists public.rpc_staff_get_customer_by_public_id(text);
create or replace function public.rpc_staff_get_customer_by_public_id(public_id_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  target_profile record;
begin
  -- 1. Auth Check
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role not in ('staff', 'admin') then
    return jsonb_build_object('found', false, 'error', 'Unauthorized');
  end if;

  -- 2. Query
  select * into target_profile from public.profiles 
  where public_id = upper(trim(public_id_query))
  limit 1;

  if target_profile.id is null then
    return jsonb_build_object('found', false, 'message', 'Not found');
  end if;

  return jsonb_build_object(
    'found', true,
    'profile', jsonb_build_object(
      'id', target_profile.id,
      'public_id', target_profile.public_id,
      'name', target_profile.name,
      'email', target_profile.email,
      'role', target_profile.role,
      'points', target_profile.points,
      'spins', target_profile.spins
    )
  );
end;
$$;

-- 3. Staff: Add Points
drop function if exists public.rpc_staff_add_points(text, integer, text);
create or replace function public.rpc_staff_add_points(public_id_query text, bill_amount_cents int, receipt_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  target_id uuid;
  points_to_add int;
  new_points int;
  new_spins int;
begin
  -- 1. Auth Check
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role not in ('staff', 'admin') then
    return jsonb_build_object('status', 'error', 'message', 'Unauthorized');
  end if;

  -- 2. Logic: 1 point per $1 (100 cents)
  points_to_add := floor(bill_amount_cents / 100);
  if points_to_add <= 0 then
     return jsonb_build_object('status', 'error', 'message', 'Amount too low');
  end if;

  -- 3. Find Customer
  select id into target_id from public.profiles where public_id = upper(trim(public_id_query));
  
  if target_id is null then
    return jsonb_build_object('status', 'error', 'message', 'User not found');
  end if;

  -- 4. Update
  update public.profiles
  set points = points + points_to_add
  where id = target_id
  returning points, spins into new_points, new_spins;

  -- 5. Log (If table exists, minimal effort here)
  insert into public.activity_logs (user_id, action, details, timestamp)
  values (target_id, 'EARN_POINTS', 'Earned ' || points_to_add || ' pts for $' || (bill_amount_cents/100)::text, now());

  return jsonb_build_object(
    'status', 'success',
    'points_added', points_to_add,
    'new_points', new_points,
    'new_spins', new_spins
  );
end;
$$;

-- 4. Customer: Convert Points
drop function if exists public.rpc_customer_convert_points(int);
create or replace function public.rpc_customer_convert_points(spins_to_buy int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cost int;
  user_points int;
  new_points int;
  new_spins int;
begin
  cost := spins_to_buy * 100; -- 100 pts per spin

  -- Lock Row
  select points into user_points from public.profiles where id = auth.uid() for update;
  
  if user_points is null then
     return jsonb_build_object('success', false, 'message', 'User not found');
  end if;

  if user_points < cost then
    return jsonb_build_object('success', false, 'message', 'Insufficient points');
  end if;

  update public.profiles
  set points = points - cost,
      spins = spins + spins_to_buy
  where id = auth.uid()
  returning points, spins into new_points, new_spins;

   insert into public.activity_logs (user_id, action, details, timestamp)
   values (auth.uid(), 'CONVERT_POINTS', 'Converted ' || cost || ' pts for ' || spins_to_buy || ' spins', now());

  return jsonb_build_object('success', true, 'new_points', new_points, 'new_spins', new_spins);
end;
$$;

-- 5. Staff: Redeem Coupon
drop function if exists public.rpc_staff_redeem_coupon(text);
create or replace function public.rpc_staff_redeem_coupon(code_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  -- Assuming 'rewards' table holds generated coupons/wins
  coupon_record record;
begin
  -- 1. Auth Check
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role not in ('staff', 'admin') then
    return jsonb_build_object('success', false, 'message', 'Unauthorized');
  end if;

  -- 2. Find and Lock Coupon
  -- Assuming table name 'rewards' and columns 'code' and 'isUsed' based on types.ts context
  -- Adjust table name if needed.
  select * into coupon_record from public.rewards 
  where code = code_query 
  for update;

  if coupon_record.id is null then
     return jsonb_build_object('success', false, 'message', 'Coupon not found');
  end if;

  if coupon_record."isUsed" = true then
     return jsonb_build_object('success', false, 'message', 'Already used');
  end if;

  -- 3. Mark Used
  update public.rewards
  set "isUsed" = true
  where id = coupon_record.id;

  insert into public.activity_logs (user_id, action, details, timestamp)
  values (auth.uid(), 'REDEMPTION', 'Staff redeemed ' || code_query, now());

  return jsonb_build_object('success', true);
end;
$$;

-- 6. Customer: Spin Wheel (Simplified)
drop function if exists public.rpc_customer_spin_wheel();
create or replace function public.rpc_customer_spin_wheel()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_spins int;
  win_idx int;
  prizes jsonb[];
  selected_prize jsonb;
  new_reward_id uuid;
begin
  -- Lock user
  select spins into user_spins from public.profiles where id = auth.uid() for update;
  
  if user_spins < 1 then
    return jsonb_build_object('ok', false, 'error', 'No spins left');
  end if;

  -- Deduct Spin
  update public.profiles set spins = spins - 1 where id = auth.uid();

  -- Trivial Random Logic (In real app, query prize config table)
  -- For now, purely random demo 
  win_idx := floor(random() * 3); -- 0, 1, 2
  
  if win_idx = 0 then
     -- Win Something
     insert into public.rewards (id, title, description, "expiryDate", "isUsed", type, code, "imageUrl", "userId")
     values (gen_random_uuid(), '10% Off', '10% Discount on Bill', now() + interval '7 days', false, 'DISCOUNT', 'WIN-'||upper(substring(encode(gen_random_bytes(3),'hex'),1,4)), 'url', auth.uid())
     returning id into new_reward_id;
     
     insert into public.activity_logs (user_id, action, details, timestamp)
     values (auth.uid(), 'SPIN', 'Won 10% Off', now());

     return jsonb_build_object('ok', true, 'outcome', 'WIN', 'prize', jsonb_build_object('title', '10% Off'));
  else
     insert into public.activity_logs (user_id, action, details, timestamp)
     values (auth.uid(), 'SPIN', 'No Win', now());
     return jsonb_build_object('ok', true, 'outcome', 'NO_WIN');
  end if;
end;
$$;
