-- ============================================================================
-- AdoptMe — Крок 1 міграції безпеки: Supabase Auth + RLS
-- ----------------------------------------------------------------------------
-- Ідентичність застосунку переходить зі "userNickname (localStorage)" на
-- auth.uid() (Supabase Auth). Роль перевіряється в БД (is_admin()), а не на
-- клієнті. Вхід — за нікнеймом (email лишається для відновлення паролю).
--
-- ЯК ЗАСТОСОВУВАТИ:
--   * Через Supabase CLI:   supabase db push
--   * Або вручну: скопіювати цей файл у SQL Editor дашборду і виконати.
--
-- ВАЖЛИВО ПРО ПОРЯДОК:
--   ЧАСТИНА A (структура) — безпечна, НЕ ламає поточний застосунок.
--   ЧАСТИНА B (RLS)       — вмикає захист і ЛАМАЄ старі anon-запити.
--                           Виконувати РАЗОМ із деплоєм React-частини (Крок 2).
--   Оскільки проєкт pre-launch, можна виконати обидві частини одразу на
--   staging-проєкті Supabase.
-- ============================================================================


-- ############################################################################
-- ЧАСТИНА A — СТРУКТУРА (безпечно виконувати будь-коли)
-- ############################################################################

-- 1. Таблиця публічних профілів, прив'язана 1:1 до auth.users -----------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null unique,
  first_name  text,
  last_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Публічний профіль користувача. Креденшли — в auth.users. Роль міняється лише адміном/дашбордом.';

-- 2. Хелпер: чи є поточний користувач адміном --------------------------------
--    SECURITY DEFINER — читає profiles в обхід RLS, без рекурсії в політиках.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Автостворення профілю при реєстрації ------------------------------------
--    Дані беруться з user_metadata, які передаємо в supabase.auth.signUp().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', 'user_' || left(new.id::text, 8)),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Захист від самопризначення ролі -----------------------------------------
--    Звичайний користувач НЕ може змінити свою роль (навіть якщо RLS дозволяє
--    update власного рядка). Змінити роль може лише адмін.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;  -- тихо відкидаємо спробу ескалації
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 5. Безпечні RPC для реєстрації/UX (віддають лише boolean, без PII) ----------
create or replace function public.nickname_available(p_nickname text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles where lower(nickname) = lower(p_nickname)
  );
$$;

revoke all on function public.nickname_available(text) from public;
grant execute on function public.nickname_available(text) to anon, authenticated;

-- Резолвінг нікнейм → email для входу (вхід у застосунку за нікнеймом).
-- SECURITY DEFINER, бо profiles закриті RLS. Віддає лише email.
-- ТРЕЙД-ОФ: дозволяє зіставити нікнейм з email (енумерація). Прийнятно для
-- малого застосунку; для хардненгу пізніше можна винести вхід в Edge Function,
-- щоб email не покидав сервер. Спроби паролю все одно рейт-лімітить Supabase Auth.
create or replace function public.get_login_email(p_nickname text)
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select u.email
  from public.profiles pr
  join auth.users u on u.id = pr.id
  where lower(pr.nickname) = lower(p_nickname)
  limit 1;
$$;

revoke all on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;

-- Самостійне видалення акаунта користувачем. Видаляє рядок у auth.users;
-- profiles та власні дані (Favorites/нотифікації) підуть каскадом за FK.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- Видалення користувача адміном (для сторінки «Користувачі»).
-- Перевіряє is_admin() всередині; видаляє рядок auth.users (каскад як вище).
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Доступ заборонено';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- 6. Нові колонки-власники (uuid замість рядка-нікнейму) ----------------------
--    Старі колонки UserNickname поки лишаємо (приберемо після міграції React).
alter table public."Favorites"              add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public."AdoptionRequests"       add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public."FavoriteNotifications"  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public."TreatmentNotifications" add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public."Reviews"                add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public."Pets"                   add column if not exists "OwnerUserId" uuid references auth.users(id) on delete set null;


-- ############################################################################
-- ЧАСТИНА B — RLS (вмикати РАЗОМ із React-частиною / на staging одразу)
-- ----------------------------------------------------------------------------
-- Після ввімкнення старі anon-запити за нікнеймом перестануть працювати —
-- застосунок має вже ходити через Supabase Auth (auth.uid()).
-- ############################################################################

-- 7. profiles: читати може лише власник або адмін (телефон/прізвище = PII) ----
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own or admin"   on public.profiles;
drop policy if exists "profiles: update own"           on public.profiles;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- INSERT не дозволяємо клієнту — профіль створює тригер on_auth_user_created.
-- DELETE не дозволяємо — акаунт видаляється через auth.admin.deleteUser (Edge Function).

-- 8. Pets: публічне читання, зміни лише адмін --------------------------------
alter table public."Pets" enable row level security;

drop policy if exists "pets: public read"  on public."Pets";
drop policy if exists "pets: admin write"  on public."Pets";

create policy "pets: public read" on public."Pets"
  for select using (true);

create policy "pets: admin write" on public."Pets"
  for all using (public.is_admin()) with check (public.is_admin());

-- 9. Favorites: кожен бачить і змінює лише своє -------------------------------
alter table public."Favorites" enable row level security;

drop policy if exists "favorites: own" on public."Favorites";

create policy "favorites: own" on public."Favorites"
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 10. AdoptionRequests: юзер створює/бачить свої; адмін бачить і змінює всі ----
alter table public."AdoptionRequests" enable row level security;

drop policy if exists "requests: insert own"       on public."AdoptionRequests";
drop policy if exists "requests: read own or admin" on public."AdoptionRequests";
drop policy if exists "requests: admin update"     on public."AdoptionRequests";
drop policy if exists "requests: admin delete"     on public."AdoptionRequests";

create policy "requests: insert own" on public."AdoptionRequests"
  for insert with check (user_id = auth.uid());

create policy "requests: read own or admin" on public."AdoptionRequests"
  for select using (user_id = auth.uid() or public.is_admin());

create policy "requests: admin update" on public."AdoptionRequests"
  for update using (public.is_admin()) with check (public.is_admin());

create policy "requests: admin delete" on public."AdoptionRequests"
  for delete using (public.is_admin());

-- 11. FavoriteNotifications: власник читає/оновлює (IsRead), адмін створює -----
alter table public."FavoriteNotifications" enable row level security;

drop policy if exists "fav-notif: read own"   on public."FavoriteNotifications";
drop policy if exists "fav-notif: update own" on public."FavoriteNotifications";
drop policy if exists "fav-notif: admin insert" on public."FavoriteNotifications";

create policy "fav-notif: read own" on public."FavoriteNotifications"
  for select using (user_id = auth.uid());

create policy "fav-notif: update own" on public."FavoriteNotifications"
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "fav-notif: admin insert" on public."FavoriteNotifications"
  for insert with check (public.is_admin());

-- 12. TreatmentNotifications: юзер підписується/бачить своє, адмін бачить усі --
alter table public."TreatmentNotifications" enable row level security;

drop policy if exists "treat-notif: insert own"        on public."TreatmentNotifications";
drop policy if exists "treat-notif: read own or admin" on public."TreatmentNotifications";
drop policy if exists "treat-notif: admin update"      on public."TreatmentNotifications";

create policy "treat-notif: insert own" on public."TreatmentNotifications"
  for insert with check (user_id = auth.uid());

create policy "treat-notif: read own or admin" on public."TreatmentNotifications"
  for select using (user_id = auth.uid() or public.is_admin());

create policy "treat-notif: admin update" on public."TreatmentNotifications"
  for update using (public.is_admin()) with check (public.is_admin());

-- 13. Reviews: публічне читання, автор створює/редагує своє, адмін модерує -----
alter table public."Reviews" enable row level security;

drop policy if exists "reviews: public read"      on public."Reviews";
drop policy if exists "reviews: insert own"       on public."Reviews";
drop policy if exists "reviews: update own or admin" on public."Reviews";
drop policy if exists "reviews: delete own or admin" on public."Reviews";

create policy "reviews: public read" on public."Reviews"
  for select using (true);

create policy "reviews: insert own" on public."Reviews"
  for insert with check (user_id = auth.uid());

create policy "reviews: update own or admin" on public."Reviews"
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "reviews: delete own or admin" on public."Reviews"
  for delete using (user_id = auth.uid() or public.is_admin());

-- 14. Storage (бакет 'pets'): публічне читання, запис/зміна лише адмін --------
--     Прибирає можливість анонімам заливати/перезаписувати файли.
drop policy if exists "pets storage: public read" on storage.objects;
drop policy if exists "pets storage: admin write" on storage.objects;
drop policy if exists "pets storage: admin update" on storage.objects;
drop policy if exists "pets storage: admin delete" on storage.objects;

create policy "pets storage: public read" on storage.objects
  for select using (bucket_id = 'pets');

create policy "pets storage: admin write" on storage.objects
  for insert with check (bucket_id = 'pets' and public.is_admin());

create policy "pets storage: admin update" on storage.objects
  for update using (bucket_id = 'pets' and public.is_admin());

create policy "pets storage: admin delete" on storage.objects
  for delete using (bucket_id = 'pets' and public.is_admin());


-- ############################################################################
-- ПІСЛЯ МІГРАЦІЇ (виконати вручну, коли React-частина готова й перевірена):
-- ############################################################################
-- -- Прибрати дані, прив'язані до старих нікнеймів (pre-launch, тестові):
--    delete from public."Favorites";
--    delete from public."AdoptionRequests";
--    delete from public."FavoriteNotifications";
--    delete from public."TreatmentNotifications";
--    delete from public."Reviews";
--
-- -- Коли жоден код більше не читає стару таблицю Users:
--    drop table if exists public."Users";
--
-- -- Призначити адміна (замість <NICKNAME>):
--    update public.profiles set role = 'admin'
--    where nickname = '<NICKNAME>';
-- ############################################################################
