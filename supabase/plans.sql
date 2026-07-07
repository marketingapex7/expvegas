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
