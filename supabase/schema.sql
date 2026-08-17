-- ============================================================
-- 후회 지도 (Regret Map) — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 전체 실행하십시오.
-- ============================================================

create extension if not exists "pgcrypto";

-- 1) 핀 테이블 --------------------------------------------------
create table if not exists public.pins (
  id             uuid primary key default gen_random_uuid(),
  lat            double precision not null,
  lng            double precision not null,
  category       text not null check (category in ('money','love','career','daily','etc')),
  text           text not null check (char_length(text) <= 50 and char_length(text) > 0),
  empathy_count  integer not null default 0,
  device_id      uuid not null,
  created_at     timestamptz not null default now()
);

create index if not exists pins_created_at_idx on public.pins (created_at desc);
create index if not exists pins_category_idx on public.pins (category);
-- 지도 화면 범위 조회 최적화 (위경도 범위 검색)
create index if not exists pins_lat_lng_idx on public.pins (lat, lng);

-- 2) 공감 테이블 (기기당 핀 1회 공감 제한) -----------------------
create table if not exists public.pin_empathies (
  id          uuid primary key default gen_random_uuid(),
  pin_id      uuid not null references public.pins(id) on delete cascade,
  device_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (pin_id, device_id)
);

-- 3) 공감 등록 시 pins.empathy_count 자동 증가 트리거 -------------
create or replace function public.increment_empathy_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pins set empathy_count = empathy_count + 1 where id = new.pin_id;
  return new;
end;
$$;

drop trigger if exists trg_increment_empathy on public.pin_empathies;
create trigger trg_increment_empathy
  after insert on public.pin_empathies
  for each row execute function public.increment_empathy_count();

-- 4) Row Level Security -----------------------------------------
-- 비회원(anon) 익명 서비스이므로 조회/생성은 누구나, 수정/삭제는 차단합니다.
alter table public.pins enable row level security;
alter table public.pin_empathies enable row level security;

drop policy if exists "pins_select_all" on public.pins;
create policy "pins_select_all" on public.pins for select using (true);

drop policy if exists "pins_insert_all" on public.pins;
create policy "pins_insert_all" on public.pins for insert with check (
  char_length(text) <= 50 and char_length(text) > 0
);

drop policy if exists "empathies_select_all" on public.pin_empathies;
create policy "empathies_select_all" on public.pin_empathies for select using (true);

drop policy if exists "empathies_insert_all" on public.pin_empathies;
create policy "empathies_insert_all" on public.pin_empathies for insert with check (true);

-- pins 테이블에 대한 UPDATE/DELETE 정책은 의도적으로 만들지 않습니다.
-- (empathy_count 증가는 오직 security definer 트리거를 통해서만 가능)
