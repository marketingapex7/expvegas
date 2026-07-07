create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  address text,
  area text,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  subcategory text,
  venue_id uuid references venues(id),
  venue_name text,
  description text,
  quick_verdict text,
  price_min numeric,
  price_max numeric,
  age_restriction text,
  runtime_minutes integer,
  affiliate_url text,
  image_url text,
  source text,
  source_event_id text,
  editorial_score integer default 50,
  value_score integer default 50,
  wow_score integer default 50,
  family_score integer default 50,
  couples_score integer default 50,
  bachelor_score integer default 50,
  is_published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table event_tags (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  tag text not null
);

create table planner_requests (
  id uuid primary key default gen_random_uuid(),
  travel_dates text,
  group_type text,
  budget text,
  vibe text,
  staying_near text,
  dealbreakers text,
  output jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  share_token text unique not null default encode(gen_random_bytes(18), 'hex'),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default now() + interval '30 days',
  email text,
  input_json jsonb not null,
  result_json jsonb not null,
  status text not null default 'active'
);

create index if not exists plans_share_token_idx on plans (share_token);

alter table plans enable row level security;

create table affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  source text,
  page_path text,
  created_at timestamp with time zone default now()
);

create table email_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  travel_dates text,
  group_type text,
  budget text,
  created_at timestamp with time zone default now()
);
