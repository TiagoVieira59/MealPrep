-- MealPrep: esquema inicial. RLS em todas as tabelas. Operações de admin/IA passam por route handlers (service role).

create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  objective text,
  kcal int,
  protein int,
  prefs jsonb not null default '{}',   -- só preferências; sem medidas corporais
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  code_hmac text not null unique,
  owner uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create table household_members (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  kcal int,        -- null = porção normal
  protein int,
  primary key (household_id, user_id)
);

create function my_households() returns setof uuid
language sql stable security definer set search_path = public as
$$ select household_id from household_members where user_id = auth.uid() $$;

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  household_id uuid references households on delete set null,
  week_start date not null,
  plan jsonb not null,
  seed int not null,
  engine_version int not null,
  created_at timestamptz not null default now()
);
create index on plans (user_id, week_start desc);
create index on plans (household_id, week_start desc);

create table household_ticks (
  household_id uuid not null references households on delete cascade,
  week_start date not null,
  item_key text not null,
  checked boolean not null default true,
  by_user uuid references auth.users on delete set null,
  primary key (household_id, week_start, item_key)
);

create table chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  from_admin boolean not null default false,
  body text not null check (char_length(body) between 1 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on chat_messages (user_id, created_at);

create table suggestions (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users on delete cascade,
  author_key text not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 3 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table suggestion_votes (
  suggestion_id uuid not null references suggestions on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  primary key (suggestion_id, user_id)
);
create table suggestion_reports (
  suggestion_id uuid not null references suggestions on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  primary key (suggestion_id, user_id)
);
create table suggestion_hidden_authors (
  user_id uuid not null references auth.users on delete cascade,
  author_key text not null,
  primary key (user_id, author_key)
);

create table creator_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, country text not null, tiktok text not null,
  links text, availability text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table creator_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  application_id uuid references creator_applications on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table creator_redemptions (
  user_id uuid primary key references auth.users on delete cascade,  -- 1 código por conta
  code_id uuid not null references creator_codes on delete cascade,
  created_at timestamptz not null default now()
);
create table creator_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  ok boolean not null,
  created_at timestamptz not null default now()
);

create table scan_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  ok boolean not null,
  created_at timestamptz not null default now()
);
create table ai_usage (
  key text not null,      -- 'global' ou 'u:<uuid>'
  day date not null,
  count int not null default 0,
  primary key (key, day)
);

-- RLS
alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table plans enable row level security;
alter table household_ticks enable row level security;
alter table chat_messages enable row level security;
alter table suggestions enable row level security;
alter table suggestion_votes enable row level security;
alter table suggestion_reports enable row level security;
alter table suggestion_hidden_authors enable row level security;
alter table creator_applications enable row level security;
alter table creator_codes enable row level security;
alter table creator_redemptions enable row level security;
alter table creator_attempts enable row level security;
alter table scan_logs enable row level security;
alter table ai_usage enable row level security;

create policy own_profile on profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy hh_read on households for select using (id in (select my_households()));
create policy hm_read on household_members for select using (household_id in (select my_households()));
create policy hm_update_self on household_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy hm_leave on household_members for delete using (user_id = auth.uid());

create policy plans_read on plans for select
  using (user_id = auth.uid() or household_id in (select my_households()));
create policy plans_write on plans for insert with check (user_id = auth.uid());
create policy plans_update on plans for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy plans_delete on plans for delete using (user_id = auth.uid());

create policy ticks_all on household_ticks for all
  using (household_id in (select my_households()))
  with check (household_id in (select my_households()));

create policy chat_read on chat_messages for select using (user_id = auth.uid());
create policy chat_write on chat_messages for insert with check (user_id = auth.uid() and from_admin = false);
create policy chat_mark_read on chat_messages for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sug_read on suggestions for select
  using (author = auth.uid() or (status = 'approved' and not hidden));
create policy votes_own on suggestion_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reports_own on suggestion_reports for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy hidden_own on suggestion_hidden_authors for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy redemptions_read on creator_redemptions for select using (user_id = auth.uid());
create policy scan_read on scan_logs for select using (user_id = auth.uid());
-- creator_applications, creator_codes, creator_attempts, ai_usage: sem políticas = só service role.
