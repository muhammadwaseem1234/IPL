alter table public.players
add column if not exists category text
check (
  category is null
  or category in ('Legendary', 'Elite', 'Veteran', 'Rising Star')
);

create index if not exists players_category_idx on public.players (category);

create or replace function public.enforce_max_squad_size()
returns trigger
language plpgsql
as $$
declare
  squad_count integer;
begin
  select count(*)::integer
  into squad_count
  from public.squads
  where franchise = new.franchise
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if squad_count >= 15 then
    raise exception 'Squad limit reached for franchise % (max 15 players).', new.franchise;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_squads_max_size on public.squads;
create trigger trg_squads_max_size
before insert or update of franchise
on public.squads
for each row
execute function public.enforce_max_squad_size();
