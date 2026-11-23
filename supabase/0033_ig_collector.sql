-- 인스타 릴스 분석용 수집 테이블 (2026-11-23)
-- 수집은 Supabase Edge Function `ig-collect`가 Meta 공식 Instagram Graph API(business_discovery)로 한다.
-- 참고 계정의 공개 게시물 정보(캡션·좋아요·댓글 수·올린 시각)만 저장한다. 학생 정보와는 무관.
--
-- 권한: 메딕차트 admin/editor만 읽기·참고 계정 관리 가능. 쓰기는 Edge Function(서비스 롤)이 한다.

create table if not exists public.ig_accounts (
  username      text primary key check (username ~ '^[a-z0-9._]{1,30}$'),
  category      text,                      -- 수학강사 / 교육브랜드 / 공부크리에이터 / 학원 / 우리계정
  note          text,
  active        boolean not null default true,
  added_at      timestamptz not null default now(),
  last_status   text,                      -- ok / 비즈니스계정아님 / 오류 메시지
  last_checked  timestamptz
);

create table if not exists public.ig_account_stats (
  username        text not null references public.ig_accounts(username) on delete cascade,
  collected_on    date not null default ((now() at time zone 'Asia/Seoul')::date),
  name            text,
  biography       text,
  followers_count integer,
  media_count     integer,
  primary key (username, collected_on)
);

create table if not exists public.ig_media (
  id                 text primary key,
  username           text not null references public.ig_accounts(username) on delete cascade,
  media_type         text,                 -- IMAGE / VIDEO / CAROUSEL_ALBUM
  media_product_type text,                 -- FEED / REELS / STORY
  caption            text,
  permalink          text,
  posted_at          timestamptz,
  thumbnail_url      text,
  media_url          text,
  like_count         integer,
  comments_count     integer,
  first_seen         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists ig_media_username_posted_idx on public.ig_media (username, posted_at desc);

-- 수집할 때마다 반응 수를 기록해 두면 "올린 뒤 며칠 만에 반응이 붙는지"를 볼 수 있다.
create table if not exists public.ig_media_snapshots (
  media_id       text not null references public.ig_media(id) on delete cascade,
  collected_on   date not null default ((now() at time zone 'Asia/Seoul')::date),
  like_count     integer,
  comments_count integer,
  primary key (media_id, collected_on)
);

create table if not exists public.ig_runs (
  id          bigserial primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  ok          integer not null default 0,
  failed      integer not null default 0,
  note        text
);

alter table public.ig_accounts        enable row level security;
alter table public.ig_account_stats   enable row level security;
alter table public.ig_media           enable row level security;
alter table public.ig_media_snapshots enable row level security;
alter table public.ig_runs            enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ig_accounts','ig_account_stats','ig_media','ig_media_snapshots','ig_runs'] loop
    execute format('drop policy if exists "staff read %1$s" on public.%1$I', t);
    execute format($p$create policy "staff read %1$s" on public.%1$I for select to authenticated
      using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')))$p$, t);
  end loop;
end $$;

-- 참고 계정은 관리자 화면에서 추가·끄기 할 수 있게 admin/editor에게 쓰기 허용
drop policy if exists "staff write ig_accounts" on public.ig_accounts;
create policy "staff write ig_accounts" on public.ig_accounts for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor')));

-- 우리 계정은 기본으로 넣어 둔다 (우리 게시물 반응도 같이 쌓이도록)
insert into public.ig_accounts (username, category, note)
values ('medic_math', '우리계정', '메딕수학 공식 계정')
on conflict (username) do nothing;

-- 주 2회(월·목 새벽 2시 KST) 자동 수집
select cron.unschedule('ig-collect-twice-weekly')
where exists (select 1 from cron.job where jobname = 'ig-collect-twice-weekly');
select cron.schedule(
  'ig-collect-twice-weekly',
  '0 17 * * 0,3',
  $c$select net.http_post(
       url := 'https://udiorqdkltsdvlfspgth.supabase.co/functions/v1/ig-collect',
       headers := '{"Content-Type":"application/json"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 120000)$c$
);
