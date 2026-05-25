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

-- ============ SEGURANÇA: FASE 1 (tampa vazamento do hash do PIN) ============
-- Esconde a coluna pin pro anon (não pode mais ser baixada)
revoke select on profiles from anon;
grant select (name, counts, scores, updated_at, paid, paid_thanks_seen) on profiles to anon;

-- RPC pra fazer login no servidor (compara, não retorna o hash)
create or replace function login_check(p_name text, p_pin_hash text)
returns boolean language sql security definer set search_path = public as $$
  select exists(
    select 1 from profiles where name = p_name and pin = p_pin_hash
  );
$$;
grant execute on function login_check to anon;

-- ============ SEGURANÇA: FASE 2 (todas as escritas via RPC com PIN) ============
-- Tira tudo que escreve direto do anon
revoke insert, update, delete on
  profiles, groups, group_members, group_requests,
  trade_requests, chat_messages from anon;

-- 1) Cria perfil novo (signup) — chamado quando nome não existe
create or replace function register_profile(
  p_name text, p_pin_hash text
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (name, pin, counts, scores)
  values (p_name, p_pin_hash, '{}'::jsonb, '{}'::jsonb);
end $$;
grant execute on function register_profile to anon;

-- 2) Salva progresso (counts + scores) — usado a cada figurinha clicada
create or replace function save_progress(
  p_name text, p_pin_hash text,
  p_counts jsonb, p_scores jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  update profiles set counts = p_counts, scores = p_scores, updated_at = now()
   where name = p_name;
end $$;
grant execute on function save_progress to anon;

-- 3) Marca agradecimento PIX como visto (o usuário viu o modal de obrigado)
create or replace function mark_paid_thanks_seen(
  p_name text, p_pin_hash text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  update profiles set paid_thanks_seen = true where name = p_name;
end $$;
grant execute on function mark_paid_thanks_seen to anon;

-- 4) Admin: marca usuário como pago no PIX (só Cauã)
create or replace function admin_set_paid(
  p_admin_name text, p_admin_pin_hash text,
  p_target text, p_paid boolean
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from profiles
     where lower(name) like 'cau%'
       and name = p_admin_name
       and pin = p_admin_pin_hash
  ) then raise exception 'forbidden'; end if;
  update profiles set
    paid = p_paid,
    paid_thanks_seen = case when p_paid then false else paid_thanks_seen end
   where name = p_target;
end $$;
grant execute on function admin_set_paid to anon;

-- 5) Admin: deleta usuário e tudo dele (só Cauã)
create or replace function admin_delete_user(
  p_admin_name text, p_admin_pin_hash text,
  p_target text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from profiles
     where lower(name) like 'cau%'
       and name = p_admin_name
       and pin = p_admin_pin_hash
  ) then raise exception 'forbidden'; end if;
  delete from group_members where profile_name = p_target;
  delete from group_requests where profile_name = p_target;
  delete from trade_requests where from_name = p_target or to_name = p_target;
  delete from chat_messages where from_name = p_target;
  delete from groups where created_by = p_target;
  delete from profiles where name = p_target;
end $$;
grant execute on function admin_delete_user to anon;

-- 6) Cria grupo (código único + adiciona criador como membro)
create or replace function create_group(
  p_name text, p_pin_hash text, p_group_name text
) returns table(code text, name text, created_by text)
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_tries int := 0;
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  loop
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from groups g where g.code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 10 then raise exception 'cannot generate code'; end if;
  end loop;
  insert into groups (code, name, created_by) values (v_code, p_group_name, p_name);
  insert into group_members (group_code, profile_name) values (v_code, p_name);
  return query select v_code, p_group_name, p_name;
end $$;
grant execute on function create_group to anon;

-- 7) Entra num grupo
create or replace function join_group(
  p_name text, p_pin_hash text, p_group_code text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  insert into group_members (group_code, profile_name)
  values (p_group_code, p_name)
  on conflict do nothing;
end $$;
grant execute on function join_group to anon;

-- 8) Sai de grupo
create or replace function leave_group(
  p_name text, p_pin_hash text, p_group_code text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  delete from group_members where group_code = p_group_code and profile_name = p_name;
end $$;
grant execute on function leave_group to anon;

-- 9) Envia pedido de troca
create or replace function send_trade_request(
  p_name text, p_pin_hash text,
  p_to_name text, p_type text,
  p_sticker_numbers integer[], p_message text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  insert into trade_requests (from_name, to_name, type, sticker_numbers, message)
  values (p_name, p_to_name, p_type, p_sticker_numbers, p_message);
end $$;
grant execute on function send_trade_request to anon;

-- 10) Atualiza status do pedido (só o destinatário pode marcar done/dismissed)
create or replace function update_trade_status(
  p_name text, p_pin_hash text,
  p_request_id uuid, p_status text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  update trade_requests set status = p_status
   where id = p_request_id and to_name = p_name;
end $$;
grant execute on function update_trade_status to anon;

-- 11) Envia mensagem no chat
create or replace function send_chat_message(
  p_name text, p_pin_hash text,
  p_group_code text, p_message text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where name = p_name and pin = p_pin_hash) then
    raise exception 'forbidden';
  end if;
  insert into chat_messages (group_code, from_name, message)
  values (p_group_code, p_name, p_message);
end $$;
grant execute on function send_chat_message to anon;
