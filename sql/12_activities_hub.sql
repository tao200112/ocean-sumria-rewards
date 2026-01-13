-- Activities configuration table
create table if not exists public.activities (
    slug text primary key,
    title text not null,
    subtitle text,
    type text not null, -- 'wheel', 'game', 'task'
    route text not null, -- e.g. '/activities/lucky-wheel'
    icon_key text, -- Material Symbol name
    badge text, -- 'Daily', 'New', etc.
    is_enabled boolean not null default true,
    sort_order int not null default 100,
    meta jsonb not null default '{}'::jsonb,
    created_at timestamptz default now()
);

-- RLS
alter table public.activities enable row level security;

-- Read: Public (or authenticated) can read enabled activities
create policy "Activities are viewable by everyone" on public.activities
    for select using (is_enabled = true);

-- Write: Only admin/service_role
create policy "Admins can insert activities" on public.activities
    for insert with check (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'manager'))
    );

create policy "Admins can update activities" on public.activities
    for update using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'manager'))
    );

-- Seed Data
insert into public.activities (slug, title, subtitle, type, route, icon_key, badge, sort_order, meta)
values 
('lucky-wheel', 'Lucky Wheel', 'Spin to win daily prizes', 'wheel', '/activities/lucky-wheel', 'casino', 'Daily', 10, '{"daily_limit": 1}'),
('tile-match', 'Tile Match', 'Match tiles to earn points', 'game', '/activities/tile-match', 'extension', 'New', 20, '{"reward_multiplier": 1.5}')
on conflict (slug) do update set 
    title = excluded.title,
    route = excluded.route,
    icon_key = excluded.icon_key,
    badge = excluded.badge;

-- Verify
select * from activities;
