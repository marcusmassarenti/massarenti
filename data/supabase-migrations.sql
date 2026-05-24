-- Pedidos de troca dentro do app
-- Cole este SQL no Supabase: Dashboard > SQL Editor > New Query > Run

create table if not exists trade_requests (
  id uuid primary key default gen_random_uuid(),
  from_name text not null,
  to_name text not null,
  type text not null check (type in ('ask', 'offer')),
  sticker_numbers integer[] not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'done', 'dismissed')),
  created_at timestamptz default now()
);

create index if not exists trade_requests_to_status_idx
  on trade_requests(to_name, status);

alter table trade_requests enable row level security;

drop policy if exists "trade_requests_read" on trade_requests;
drop policy if exists "trade_requests_insert" on trade_requests;
drop policy if exists "trade_requests_update" on trade_requests;
drop policy if exists "trade_requests_delete" on trade_requests;

create policy "trade_requests_read"   on trade_requests for select using (true);
create policy "trade_requests_insert" on trade_requests for insert with check (true);
create policy "trade_requests_update" on trade_requests for update using (true);
create policy "trade_requests_delete" on trade_requests for delete using (true);

-- ============ CHAT EM TEMPO REAL POR GRUPO ============

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_code text not null,
  from_name text not null,
  message text not null,
  created_at timestamptz default now()
);

create index if not exists chat_messages_group_time_idx
  on chat_messages(group_code, created_at desc);

alter table chat_messages enable row level security;

drop policy if exists "chat_messages_read" on chat_messages;
drop policy if exists "chat_messages_insert" on chat_messages;
drop policy if exists "chat_messages_delete" on chat_messages;

create policy "chat_messages_read"   on chat_messages for select using (true);
create policy "chat_messages_insert" on chat_messages for insert with check (true);
create policy "chat_messages_delete" on chat_messages for delete using (true);

-- Habilitar Realtime (publishar mudanças via websocket)
alter publication supabase_realtime add table chat_messages;

-- ============ AGRADECIMENTO PIX ============
-- Marca se o usuário já viu a mensagem de "obrigado" depois de pagar.
-- Default true: usuários antigos NÃO ganham o popup retroativo.
-- Quando admin marca paid=true, o app também seta paid_thanks_seen=false
-- pra disparar o modal pro usuário na próxima entrada.

alter table profiles add column if not exists paid_thanks_seen boolean default true;
