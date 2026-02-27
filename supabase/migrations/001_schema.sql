-- Enable UUID support
create extension if not exists "uuid-ossp";

-- Devices
create table if not exists public.devices (
  id uuid primary key default uuid_generate_v4(),
  fingerprint text unique not null,
  role text not null check (role in ('admin', 'view', 'auction', 'backup')),
  franchise text check (
    franchise is null
    or franchise in ('MI', 'CSK', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'GT', 'LSG')
  ),
  connected_at timestamptz default now(),
  active boolean default true
);

-- Players
create table if not exists public.players (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null,
  base_price numeric not null check (base_price >= 0),
  ais numeric not null,
  batting numeric,
  bowling numeric,
  fielding numeric,
  leadership numeric,
  image_path text
);

create unique index if not exists players_name_unique_idx on public.players (name);

-- Teams
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  franchise text unique not null check (
    franchise in ('MI', 'CSK', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'GT', 'LSG')
  ),
  purse numeric default 90 check (purse >= 0),
  device_id uuid references public.devices(id) on delete set null
);

-- Auction State
create table if not exists public.auction_state (
  id uuid primary key default uuid_generate_v4(),
  current_player_id uuid references public.players(id) on delete set null,
  status text default 'waiting' check (status in ('waiting', 'running', 'paused', 'assigned', 'completed')),
  current_bid numeric default 0 check (current_bid >= 0),
  current_leader_device_id uuid references public.devices(id) on delete set null,
  timer_end timestamptz,
  updated_at timestamptz default now()
);

-- Bids
create table if not exists public.bids (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references public.players(id) on delete cascade,
  device_id uuid references public.devices(id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

-- Squads
create table if not exists public.squads (
  id uuid primary key default uuid_generate_v4(),
  franchise text not null check (
    franchise in ('MI', 'CSK', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'GT', 'LSG')
  ),
  player_id uuid references public.players(id) on delete cascade,
  price numeric not null check (price >= 0)
);

create unique index if not exists squads_player_unique_idx on public.squads (player_id);

-- Evaluation Results
create table if not exists public.evaluation_results (
  id uuid primary key default uuid_generate_v4(),
  franchise text not null check (
    franchise in ('MI', 'CSK', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'GT', 'LSG')
  ),
  base_score numeric not null default 0,
  bonus numeric not null default 0,
  efficiency numeric not null default 0,
  penalties numeric not null default 0,
  final_score numeric not null default 0
);

create unique index if not exists evaluation_results_franchise_unique_idx on public.evaluation_results (franchise);

-- Indexes
create index if not exists bids_player_id_idx on public.bids (player_id);
create index if not exists bids_device_id_idx on public.bids (device_id);
create index if not exists squads_franchise_idx on public.squads (franchise);
create index if not exists players_role_idx on public.players (role);

-- Auction state timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_auction_state_updated_at on public.auction_state;
create trigger trg_auction_state_updated_at
before update on public.auction_state
for each row execute function public.set_updated_at();

-- Helper for server-time based calculations
create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

-- Seed teams (idempotent)
insert into public.teams (franchise)
values
  ('MI'),
  ('CSK'),
  ('RCB'),
  ('KKR'),
  ('DC'),
  ('SRH'),
  ('RR'),
  ('PBKS'),
  ('GT'),
  ('LSG')
on conflict (franchise) do nothing;

-- Ensure a singleton auction row exists
insert into public.auction_state (status, current_bid)
select 'waiting', 0
where not exists (select 1 from public.auction_state);

-- Realtime publication (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'auction_state'
  ) then
    alter publication supabase_realtime add table public.auction_state;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bids'
  ) then
    alter publication supabase_realtime add table public.bids;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table public.teams;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'squads'
  ) then
    alter publication supabase_realtime add table public.squads;
  end if;
end
$$;

-- RLS setup (read-only for anon/authenticated realtime consumers)
alter table public.players enable row level security;
alter table public.teams enable row level security;
alter table public.auction_state enable row level security;
alter table public.bids enable row level security;
alter table public.squads enable row level security;
alter table public.evaluation_results enable row level security;

drop policy if exists "public read players" on public.players;
create policy "public read players"
on public.players
for select
using (true);

drop policy if exists "public read teams" on public.teams;
create policy "public read teams"
on public.teams
for select
using (true);

drop policy if exists "public read auction state" on public.auction_state;
create policy "public read auction state"
on public.auction_state
for select
using (true);

drop policy if exists "public read bids" on public.bids;
create policy "public read bids"
on public.bids
for select
using (true);

drop policy if exists "public read squads" on public.squads;
create policy "public read squads"
on public.squads
for select
using (true);

drop policy if exists "public read evaluation results" on public.evaluation_results;
create policy "public read evaluation results"
on public.evaluation_results
for select
using (true);
