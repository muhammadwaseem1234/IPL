alter table public.players
add column if not exists nationality text;

create index if not exists players_nationality_idx on public.players (nationality);
