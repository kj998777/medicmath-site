-- 급상승 문구·해시태그 탐지 (2026-11-23)
-- 최근 p_days일 동안 "여러 계정이 새로 쓰기 시작한" 해시태그·두 단어 문구와,
-- 계정 평소(중간값)보다 크게 튄 최근 게시물을 한 번에 돌려준다.
-- 매주 월요일 예약 작업이 이 결과로 '이번 주 유행' 리포트를 만든다.

create or replace function insta.trend_report(p_days int default 7, p_base_days int default 56)
returns jsonb
language sql stable security definer
set search_path = insta, pg_temp
as $fn$
with acc as (
  select username, category from insta.ig_accounts where active and username <> 'medic_math'
),
media as (
  select m.*, a.category,
         case when m.posted_at > now() - make_interval(days => p_days) then 'recent'
              when m.posted_at > now() - make_interval(days => p_base_days) then 'base' end as win
  from insta.ig_media m join acc a using (username)
  where m.posted_at > now() - make_interval(days => p_base_days)
),
-- 해시태그
tags as (
  select lower(t[1]) as term, username, win
  from media, regexp_matches(coalesce(caption, ''), '#([^[:space:]#.,!?()\[\]"'']{2,30})', 'g') t
),
-- 캡션 앞부분(첫 200자)의 두 단어 문구
words as (
  select username, win, id, ord, w
  from media,
       regexp_split_to_table(lower(regexp_replace(left(coalesce(caption, ''), 200), '[#@][^[:space:]]+|[^[:alnum:][:space:]가-힣]', ' ', 'g')), '\s+')
       with ordinality as x(w, ord)
  where length(w) >= 2
),
phrases as (
  select a.w || ' ' || b.w as term, a.username, a.win
  from words a join words b on b.id = a.id and b.ord = a.ord + 1
),
score as (
  select kind, term,
         count(distinct username) filter (where win = 'recent') as recent_accts,
         count(distinct username) filter (where win = 'base') as base_accts
  from (select 'tag' kind, term, username, win from tags
        union all select 'phrase', term, username, win from phrases) z
  group by kind, term
),
ranked as (
  select kind, term, recent_accts, base_accts,
         round((recent_accts::numeric / (base_accts::numeric * p_days / (p_base_days - p_days) + 0.5)), 2) as rise
  from score
  where recent_accts >= 3
),
-- 계정 평소 대비 튄 최근 게시물
s as (select distinct on (username) username, followers_count f from insta.ig_account_stats order by username, collected_on desc),
er as (
  select m.id, m.username, m.category, m.media_product_type, m.permalink, m.posted_at,
         left(regexp_replace(split_part(coalesce(m.caption, ''), E'\n', 1), '\s+', ' ', 'g'), 80) as first_line,
         (m.like_count + coalesce(m.comments_count, 0))::numeric / nullif(s.f, 0) * 100 as er, m.win
  from media m join s using (username)
  where m.like_count is not null and s.f >= 100
),
med as (select username, percentile_cont(0.5) within group (order by er)::numeric as med from er group by username),
spikes as (
  select er.*, round(er.er / nullif(med.med, 0), 1) as lift
  from er join med using (username)
  where er.win = 'recent' and med.med > 0
)
select jsonb_build_object(
  'generated_at', now(),
  'window_days', p_days,
  'accounts', (select count(*) from acc),
  'recent_posts', (select count(*) from media where win = 'recent'),
  'rising_tags', coalesce((select jsonb_agg(r order by r.rise desc, r.recent_accts desc) from
      (select term, recent_accts, base_accts, rise from ranked where kind = 'tag' order by rise desc, recent_accts desc limit 25) r), '[]'),
  'rising_phrases', coalesce((select jsonb_agg(r order by r.rise desc, r.recent_accts desc) from
      (select term, recent_accts, base_accts, rise from ranked where kind = 'phrase' order by rise desc, recent_accts desc limit 25) r), '[]'),
  'spikes', coalesce((select jsonb_agg(x order by x.lift desc) from
      (select username, category, media_product_type as type, lift, round(er, 1) as er, first_line, permalink, posted_at::date as day
       from spikes where lift >= 3 order by lift desc limit 20) x), '[]')
);
$fn$;

alter function insta.trend_report(int, int) owner to insta_owner;
revoke all on function insta.trend_report(int, int) from public, anon, authenticated, service_role;
grant execute on function insta.trend_report(int, int) to postgres;
