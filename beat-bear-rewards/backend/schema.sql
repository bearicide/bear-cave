create table public.player_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Bear' check (char_length(display_name) between 2 and 40),
 created_at timestamptz not null default now()
);
create table public.demo_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 100000),
 updated_at timestamptz not null default now()
);
create table public.paid_wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance bigint not null default 0 check (balance >= 0),
 updated_at timestamptz not null default now()
);
alter table public.player_profiles enable row level security;
alter table public.demo_progress enable row level security;
alter table public.paid_wallets enable row level security;
revoke all on public.player_profiles, public.demo_progress, public.paid_wallets from public, anon, authenticated;
grant select, insert, update on public.player_profiles, public.demo_progress to authenticated;
grant select on public.paid_wallets to authenticated;
grant all on public.player_profiles, public.demo_progress, public.paid_wallets to service_role;
create policy profiles_read_own on public.player_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.player_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.player_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy progress_read_own on public.demo_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy progress_insert_own on public.demo_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy progress_update_own on public.demo_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy paid_wallet_read_own on public.paid_wallets for select to authenticated using ((select auth.uid()) = user_id);
