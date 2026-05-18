-- Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_user_updated_idx on public.conversations(user_id, updated_at desc);

alter table public.conversations enable row level security;

create policy "Users select own conversations" on public.conversations
  for select using (auth.uid() = user_id);
create policy "Users insert own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "Users update own conversations" on public.conversations
  for update using (auth.uid() = user_id);
create policy "Users delete own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx on public.messages(conversation_id, created_at asc);

alter table public.messages enable row level security;

create policy "Users select own messages" on public.messages
  for select using (
    conversation_id in (select id from public.conversations where user_id = auth.uid())
  );
create policy "Users insert own messages" on public.messages
  for insert with check (
    conversation_id in (select id from public.conversations where user_id = auth.uid())
  );
create policy "Users delete own messages" on public.messages
  for delete using (
    conversation_id in (select id from public.conversations where user_id = auth.uid())
  );

-- Auto-update updated_at on conversations when messages change
create or replace function public.touch_conversation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_updated_at();