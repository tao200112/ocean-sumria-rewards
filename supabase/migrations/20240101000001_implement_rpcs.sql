-- Migration: 20240101000001_implement_rpcs.sql

-- Helper function to check if a prize is available
create or replace function public.is_prize_available(p_prize public.prizes, p_user_id uuid)
returns boolean as $$
declare
    v_count int;
begin
    -- 1. Check if active
    if not p_prize.active then return false; end if;

    -- 2. Check total limit
    if p_prize.total_available is not null then
        select count(*) into v_count from public.coupons where prize_id = p_prize.id;
        if v_count >= p_prize.total_available then return false; end if;
    end if;

    -- 3. Check win limit (parsing '1/day', '1/user')
    if p_prize.win_limit = '1/user' then
        perform 1 from public.coupons where prize_id = p_prize.id and user_id = p_user_id;
        if found then return false; end if;
    elsif p_prize.win_limit = '1/day' then
        perform 1 from public.coupons 
        where prize_id = p_prize.id 
          and user_id = p_user_id 
          and created_at > (now() - interval '24 hours');
        if found then return false; end if;
    end if;

    return true;
end;
$$ language plpgsql stable security definer;

-- 1. Staff Add Points
create or replace function public.rpc_staff_add_points(
    public_id_query text, 
    bill_amount_cents int, 
    receipt_ref text
)
returns int as $$
declare
    v_user_id uuid;
    v_points_earned int;
    v_new_points int;
begin
    -- Check permissions
    if not exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')) then
        raise exception 'Access denied: Staff only';
    end if;

    -- Find user
    select id into v_user_id from public.profiles where public_id = public_id_query;
    if v_user_id is null then
        raise exception 'User not found with public_id: %', public_id_query;
    end if;

    -- Calculate points
    v_points_earned := floor(bill_amount_cents / 100);

    -- Update with lock
    update public.profiles 
    set points = points + v_points_earned 
    where id = v_user_id
    returning points into v_new_points;

    -- Log
    insert into public.logs (type, actor_id, target_user_id, metadata)
    values (
        'EARN_POINTS',
        auth.uid(),
        v_user_id,
        jsonb_build_object(
            'bill_amount_cents', bill_amount_cents,
            'points_earned', v_points_earned,
            'receipt_ref', receipt_ref,
            'new_balance', v_new_points
        )
    );

    return v_new_points;
end;
$$ language plpgsql security definer;

-- 2. Convert Points
create or replace function public.rpc_customer_convert_points(
    spins_to_buy int
)
returns jsonb as $$
declare
    v_cost int;
    v_new_points int;
    v_new_spins int;
begin
    if spins_to_buy <= 0 then raise exception 'Must buy at least 1 spin'; end if;
    v_cost := spins_to_buy * 100;

    -- Lock row
    select points, spins into v_new_points, v_new_spins 
    from public.profiles where id = auth.uid() for update;

    if v_new_points < v_cost then
        raise exception 'Insufficient points. Need %, have %', v_cost, v_new_points;
    end if;

    update public.profiles
    set points = points - v_cost,
        spins = spins + spins_to_buy
    where id = auth.uid()
    returning points, spins into v_new_points, v_new_spins;

    insert into public.logs (type, actor_id, target_user_id, metadata)
    values (
        'CONVERT_POINTS',
        auth.uid(),
        auth.uid(),
        jsonb_build_object('spins_bought', spins_to_buy, 'cost', v_cost)
    );

    return jsonb_build_object('points', v_new_points, 'spins', v_new_spins);
end;
$$ language plpgsql security definer;

-- 3. Spin Wheel
create or replace function public.rpc_customer_spin_wheel()
returns jsonb as $$
declare
    v_pool_id uuid;
    v_spins int;
    v_total_weight int := 0;
    v_rand_val int;
    v_cumulative int := 0;
    v_winning_prize_id uuid;
    v_winning_prize_type text;
    v_winning_prize_name text;
    v_coupon_code text;
    v_prizes_list public.prizes[];
    v_p_cursor public.prizes;
    v_available_prizes public.prizes[];
begin
    -- 1. Check & Deduct Spin
    select spins into v_spins from public.profiles where id = auth.uid() for update;
    if v_spins is null then raise exception 'User not found'; end if;
    if v_spins < 1 then raise exception 'No spins available'; end if;

    update public.profiles set spins = spins - 1 where id = auth.uid();

    -- 2. Find published pool
    select id into v_pool_id from public.prize_pool_versions 
    where status = 'published' 
    order by published_at desc limit 1;
    
    if v_pool_id is null then raise exception 'No active prize pool'; end if;

    -- 3. Get candidates (filtering by availability)
    select array_agg(p) into v_prizes_list 
    from public.prizes p
    where pool_version_id = v_pool_id;
    
    if v_prizes_list is null then raise exception 'Prize pool is empty'; end if;

    -- 4. Calculate Weights of AVAILABLE prizes
    foreach v_p_cursor in array v_prizes_list loop
        if public.is_prize_available(v_p_cursor, auth.uid()) then
            v_available_prizes := array_append(v_available_prizes, v_p_cursor);
            v_total_weight := v_total_weight + v_p_cursor.weight;
        end if;
    end loop;

    if v_total_weight = 0 then
         raise exception 'No available prizes in pool';
    end if;

    -- 5. Random Selection
    v_rand_val := floor(random() * v_total_weight);
    
    foreach v_p_cursor in array v_available_prizes loop
        v_cumulative := v_cumulative + v_p_cursor.weight;
        if v_rand_val < v_cumulative then
            v_winning_prize_id := v_p_cursor.id;
            v_winning_prize_type := v_p_cursor.type;
            v_winning_prize_name := v_p_cursor.name;
            exit;
        end if;
    end loop;

    -- 6. Issue Coupon if win
    if v_winning_prize_type != 'no_win' then
        insert into public.coupons (user_id, prize_id, status, expires_at)
        values (auth.uid(), v_winning_prize_id, 'active', now() + interval '7 days')
        returning code into v_coupon_code;
    end if;

    -- 7. Log
    insert into public.logs (type, actor_id, target_user_id, metadata)
    values (
        'SPIN', auth.uid(), auth.uid(),
        jsonb_build_object(
            'pool_id', v_pool_id, 
            'prize_id', v_winning_prize_id, 
            'prize_name', v_winning_prize_name,
            'outcome', v_winning_prize_type,
            'coupon_code', v_coupon_code
        )
    );

    return jsonb_build_object(
        'outcome', v_winning_prize_type,
        'prize_name', v_winning_prize_name,
        'coupon_code', v_coupon_code,
        'prize', (select row_to_json(p) from public.prizes p where id = v_winning_prize_id)
    );
end;
$$ language plpgsql security definer;

-- 4. Staff Redeem Coupon
create or replace function public.rpc_staff_redeem_coupon(
    code_query text
)
returns jsonb as $$
declare
    v_coupon public.coupons;
    v_prize_name text;
    v_customer_public_id text;
begin
    if not exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')) then
        raise exception 'Access denied';
    end if;

    select * into v_coupon from public.coupons where code = code_query for update;
    
    if v_coupon.id is null then raise exception 'Invalid code'; end if;
    if v_coupon.status = 'redeemed' then raise exception 'Coupon already redeemed'; end if;
    if v_coupon.status != 'active' then raise exception 'Coupon is not active (%)', v_coupon.status; end if;
    if v_coupon.expires_at < now() then 
        update public.coupons set status='expired' where id=v_coupon.id;
        raise exception 'Coupon expired'; 
    end if;

    update public.coupons
    set status = 'redeemed',
        redeemed_at = now(),
        redeemed_by = auth.uid()
    where id = v_coupon.id;

    -- Fetch extra details
    select name into v_prize_name from public.prizes where id = v_coupon.prize_id;
    select public_id into v_customer_public_id from public.profiles where id = v_coupon.user_id;

    insert into public.logs (type, actor_id, target_user_id, metadata)
    values (
        'REDEMPTION', auth.uid(), v_coupon.user_id,
        jsonb_build_object('coupon_id', v_coupon.id, 'code', code_query, 'prize', v_prize_name)
    );

    return jsonb_build_object(
        'status', 'success',
        'prize_name', v_prize_name,
        'customer_id', v_customer_public_id,
        'redeemed_at', now()
    );
end;
$$ language plpgsql security definer;
