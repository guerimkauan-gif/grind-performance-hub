
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  dream text,
  daily_hours numeric,
  days_per_week integer,
  deadline date,
  onboarding_complete boolean not null default false,
  whoop_access_token text,
  whoop_refresh_token text,
  whoop_token_expires_at timestamptz
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can delete own profile" on public.profiles
  for delete using (auth.uid() = id);

-- daily_logs
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  recovery_score integer,
  hrv numeric,
  sleep_hours numeric,
  strain numeric,
  ai_plan text,
  adherence_score integer,
  tasks_completed integer not null default 0,
  tasks_total integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.daily_logs enable row level security;

create policy "Users can view own logs" on public.daily_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.daily_logs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own logs" on public.daily_logs
  for update using (auth.uid() = user_id);
create policy "Users can delete own logs" on public.daily_logs
  for delete using (auth.uid() = user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
