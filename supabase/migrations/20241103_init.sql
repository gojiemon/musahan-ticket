-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Tables
create table if not exists shows (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  visual_url text,
  created_at timestamptz not null default now()
);

create table if not exists performances (
  id uuid primary key default uuid_generate_v4(),
  show_id uuid not null references shows(id) on delete cascade,
  start_at timestamptz not null,
  venue text not null,
  capacity int not null check (capacity > 0),
  reserved_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  performance_id uuid not null references performances(id) on delete cascade,
  name text not null,
  email text not null,
  email_norm text not null,
  qty int not null check (qty > 0),
  note text,
  status text not null check (status in ('confirmed','cancelled')) default 'confirmed',
  token uuid unique not null,
  checked_in boolean not null default false,
  created_at timestamptz not null default now()
);
-- email_norm is intentionally not unique (allow duplicates across performances)

create table if not exists subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  email_norm text not null unique,
  name text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  tags text[] default '{}',
  confirm_token uuid,
  confirm_token_expires_at timestamptz,
  unsub_token uuid unique,
  created_at timestamptz not null default now()
);

create table if not exists consents (
  id uuid primary key default uuid_generate_v4(),
  subscriber_id uuid references subscribers(id) on delete cascade,
  text text,
  checked_at timestamptz,
  ip text,
  user_agent text,
  source text
);

create table if not exists deliveries (
  id uuid primary key default uuid_generate_v4(),
  subject text,
  body text,
  sent_at timestamptz default now(),
  provider_msg_id text
);

create table if not exists unsub_events (
  id uuid primary key default uuid_generate_v4(),
  subscriber_id uuid references subscribers(id) on delete set null,
  at timestamptz,
  reason text
);

create table if not exists rate_limit (
  id bigserial primary key,
  ip text,
  email_norm text,
  endpoint text not null,
  ts timestamptz not null default now()
);

-- Views for public fetch / admin joins
create or replace view performances_view as
select
  p.id,
  s.title as show_title,
  p.start_at,
  p.venue,
  p.capacity,
  p.reserved_count,
  greatest(p.capacity - p.reserved_count, 0) as remaining
from performances p
join shows s on s.id = p.show_id;

create or replace view reservations_join as
select
  r.id,
  r.performance_id,
  s.title as show_title,
  p.start_at,
  p.venue,
  r.name,
  r.email,
  r.qty,
  r.status,
  r.token,
  r.checked_in,
  r.created_at
from reservations r
join performances p on p.id = r.performance_id
join shows s on s.id = p.show_id;

-- Functions

-- normalize_email: gmail rules (+ and dots)
create or replace function normalize_email(raw text) returns text
language plpgsql stable as $$
declare
  s text := lower(trim(raw));
  local text;
  domain text;
  pluspos int;
begin
  if position('@' in s) = 0 then
    return s;
  end if;
  local := split_part(s, '@', 1);
  domain := split_part(s, '@', 2);
  pluspos := position('+' in local);
  if pluspos > 0 then
    local := left(local, pluspos - 1);
  end if;
  if domain in ('gmail.com','googlemail.com') then
    local := replace(local, '.', '');
    domain := 'gmail.com';
  end if;
  return local || '@' || domain;
end;
$$;

-- Atomic seat reservation
create or replace function reserve_seats(p_performance_id uuid, p_qty int) returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  update performances
  set reserved_count = reserved_count + p_qty
  where id = p_performance_id
    and reserved_count + p_qty <= capacity;
  GET DIAGNOSTICS updated = ROW_COUNT;
  if updated = 1 then
    return true;
  else
    return false;
  end if;
end;
$$;

create or replace function release_seats(p_performance_id uuid, p_qty int) returns void
language plpgsql
as $$
begin
  update performances
  set reserved_count = greatest(reserved_count - p_qty, 0)
  where id = p_performance_id;
end;
$$;

-- Rate limit count function (60s window by default)
create or replace function rate_limit_count(p_endpoint text, p_ip text, p_email_norm text, p_window_sec int default 60)
returns int language sql stable as $$
  select count(*)::int
  from rate_limit
  where endpoint = p_endpoint
    and (p_ip is null or ip = p_ip)
    and (p_email_norm is null or email_norm = p_email_norm)
    and ts >= now() - make_interval(secs => p_window_sec)
$$;

-- Admin detection from JWT
create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() ->> 'role') in ('admin','service_role'), false)
$$;

-- Indexes
create index if not exists idx_performances_start_at on performances(start_at);
create index if not exists idx_reservations_token on reservations(token);
create index if not exists idx_subscribers_confirm_token on subscribers(confirm_token);
create index if not exists idx_subscribers_unsub_token on subscribers(unsub_token);
create index if not exists idx_rate_limit_ts on rate_limit(ts);
create index if not exists idx_reservations_perf on reservations(performance_id);

-- RLS
alter table shows enable row level security;
alter table performances enable row level security;
alter table reservations enable row level security;
alter table subscribers enable row level security;
alter table consents enable row level security;
alter table deliveries enable row level security;
alter table unsub_events enable row level security;
alter table rate_limit enable row level security;

-- shows & performances: public read-only
drop policy if exists shows_select on shows;
create policy shows_select on shows for select using (true);

drop policy if exists performances_select on performances;
create policy performances_select on performances for select using (true);

-- admin-only for others
drop policy if exists reservations_all on reservations;
create policy reservations_all on reservations
  for all using (is_admin()) with check (is_admin());

drop policy if exists subscribers_all on subscribers;
create policy subscribers_all on subscribers
  for all using (is_admin()) with check (is_admin());

drop policy if exists consents_all on consents;
create policy consents_all on consents
  for all using (is_admin()) with check (is_admin());

drop policy if exists deliveries_all on deliveries;
create policy deliveries_all on deliveries
  for all using (is_admin()) with check (is_admin());

drop policy if exists unsub_events_all on unsub_events;
create policy unsub_events_all on unsub_events
  for all using (is_admin()) with check (is_admin());

drop policy if exists rate_limit_insert on rate_limit;
create policy rate_limit_insert on rate_limit
  for insert to authenticated, anon
  with check (true);
-- allow server-side counting via service role automatically
