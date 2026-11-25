-- 유행 음원·영상 파악용 유튜브 쇼츠 수집기 (2026-11-25)
-- 인스타 공식 API에는 음원 정보가 없어서, 같은 유행이 거의 동시에 퍼지는 유튜브 쇼츠를
-- 공식 YouTube Data API v3로 매일 모은다. 제목·설명·태그에서 '○○ 챌린지'와 노래 이름을 뽑고,
-- 조회수 스냅샷으로 얼마나 빨리 뜨는지 본다.
--
-- 권한은 0034와 같다: 표 주인 insta_owner, API 노출 안 됨, 키는 Vault의 youtube_api_key(선생님이 직접 넣음).

create table if not exists insta.yt_videos (
  id            text primary key,
  title         text,
  channel_id    text,
  channel_title text,
  published_at  timestamptz,
  duration_s    integer,
  description   text,
  tags          text[],
  source        text,          -- search / popular
  query         text,          -- 어떤 검색어로 잡혔는지
  first_seen    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists yt_videos_published_idx on insta.yt_videos (published_at desc);

create table if not exists insta.yt_snapshots (
  video_id     text not null references insta.yt_videos(id) on delete cascade,
  collected_at timestamptz not null default now(),
  views        bigint,
  likes        bigint,
  comments     bigint,
  primary key (video_id, collected_at)
);

create table if not exists insta.yt_runs (
  id          bigserial primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  searched    integer not null default 0,
  saved       integer not null default 0,
  note        text
);

alter table insta.yt_videos    owner to insta_owner;
alter table insta.yt_snapshots owner to insta_owner;
alter table insta.yt_runs      owner to insta_owner;
alter sequence insta.yt_runs_id_seq owner to insta_owner;
revoke all on insta.yt_videos, insta.yt_snapshots, insta.yt_runs from anon, authenticated, service_role;
revoke all on sequence insta.yt_runs_id_seq from anon, authenticated, service_role;

-- Vault에서 유튜브 키 하나만 꺼내는 함수 (insta_owner만 실행 가능)
create or replace function insta.yt_key() returns text
language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = 'youtube_api_key' limit 1 $$;
revoke all on function insta.yt_key() from public, anon, authenticated, service_role;
grant execute on function insta.yt_key() to insta_owner;

-- ISO 8601 길이(PT1M5S) → 초
create or replace function insta.iso_dur_s(d text) returns integer
language sql immutable set search_path = ''
as $$
  select coalesce((regexp_match(d, '(\d+)H'))[1]::int, 0) * 3600
       + coalesce((regexp_match(d, '(\d+)M'))[1]::int, 0) * 60
       + coalesce((regexp_match(d, '(\d+)S'))[1]::int, 0)
$$;
alter function insta.iso_dur_s(text) owner to insta_owner;

-- 수집 함수
create or replace function insta.collect_youtube(p_days int default 7) returns jsonb
language plpgsql security definer
set search_path = insta, extensions, pg_temp
as $fn$
declare
  v_key text; v_run bigint; v_resp extensions.http_response; v_body jsonb; v_it jsonb;
  v_q text; v_since text; v_ids text[]; v_batch text[]; v_searched int := 0; v_saved int := 0; i int;
  c_api constant text := 'https://www.googleapis.com/youtube/v3/';
  c_queries constant text[] := array['챌린지', '댄스 챌린지', '릴스 챌린지', '쇼츠 챌린지', '노래 챌린지',
                                     '밈', '요즘 유행', '학생 챌린지', '고등학생 브이로그', '공부 브이로그'];
begin
  insert into insta.yt_runs default values returning id into v_run;
  v_key := insta.yt_key();
  if coalesce(v_key, '') = '' then
    update insta.yt_runs set finished_at = now(), note = 'Vault에 youtube_api_key 없음' where id = v_run;
    return jsonb_build_object('error', 'Vault에 youtube_api_key 없음');
  end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');

  create temp table if not exists _yt_found (id text primary key, q text) on commit drop;
  v_since := to_char((now() - make_interval(days => p_days)) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  -- 1) 검색어별 최근 p_days일 쇼츠(4분 미만) 조회수 순 50개
  foreach v_q in array c_queries loop
    v_resp := extensions.http_get(c_api || 'search?part=id&type=video&maxResults=50&order=viewCount'
              || '&regionCode=KR&relevanceLanguage=ko&videoDuration=short'
              || '&publishedAfter=' || extensions.urlencode(v_since)
              || '&q=' || extensions.urlencode(v_q) || '&key=' || extensions.urlencode(v_key));
    v_body := v_resp.content::jsonb;
    if v_resp.status <> 200 then
      update insta.yt_runs set note = left(coalesce(note || ' / ', '') || v_q || ': '
        || coalesce(v_body->'error'->>'message', 'HTTP ' || v_resp.status), 1000) where id = v_run;
      continue;
    end if;
    for v_it in select * from jsonb_array_elements(coalesce(v_body->'items', '[]')) loop
      insert into _yt_found values (v_it->'id'->>'videoId', v_q) on conflict do nothing;
    end loop;
  end loop;
  select count(*) into v_searched from _yt_found;

  -- 2) 상세(제목·설명·태그·길이·조회수)를 50개씩
  select array_agg(id) into v_ids from _yt_found;
  i := 1;
  while v_ids is not null and i <= array_length(v_ids, 1) loop
    v_batch := v_ids[i:i + 49];
    v_resp := extensions.http_get(c_api || 'videos?part=snippet,statistics,contentDetails&id='
              || extensions.urlencode(array_to_string(v_batch, ',')) || '&key=' || extensions.urlencode(v_key));
    v_body := v_resp.content::jsonb;
    for v_it in select * from jsonb_array_elements(coalesce(v_body->'items', '[]')) loop
      insert into insta.yt_videos (id, title, channel_id, channel_title, published_at, duration_s, description, tags, source, query, updated_at)
      values (v_it->>'id', v_it->'snippet'->>'title', v_it->'snippet'->>'channelId', v_it->'snippet'->>'channelTitle',
              (v_it->'snippet'->>'publishedAt')::timestamptz, insta.iso_dur_s(v_it->'contentDetails'->>'duration'),
              left(v_it->'snippet'->>'description', 1500),
              (select array_agg(t) from jsonb_array_elements_text(coalesce(v_it->'snippet'->'tags', '[]')) t),
              'search', (select q from _yt_found f where f.id = v_it->>'id'), now())
      on conflict (id) do update set title = excluded.title, description = excluded.description,
        tags = excluded.tags, duration_s = excluded.duration_s, updated_at = now();
      insert into insta.yt_snapshots (video_id, views, likes, comments)
      values (v_it->>'id', (v_it->'statistics'->>'viewCount')::bigint, (v_it->'statistics'->>'likeCount')::bigint,
              (v_it->'statistics'->>'commentCount')::bigint)
      on conflict do nothing;
      v_saved := v_saved + 1;
    end loop;
    i := i + 50;
  end loop;

  -- 3) 예전에 잡힌 최근 영상도 조회수만 다시 찍어 둔다 (속도 계산용)
  select array_agg(id) into v_ids from insta.yt_videos
   where published_at > now() - make_interval(days => p_days * 2) and id not in (select id from _yt_found);
  i := 1;
  while v_ids is not null and i <= array_length(v_ids, 1) loop
    v_batch := v_ids[i:i + 49];
    v_resp := extensions.http_get(c_api || 'videos?part=statistics&id='
              || extensions.urlencode(array_to_string(v_batch, ',')) || '&key=' || extensions.urlencode(v_key));
    v_body := v_resp.content::jsonb;
    for v_it in select * from jsonb_array_elements(coalesce(v_body->'items', '[]')) loop
      insert into insta.yt_snapshots (video_id, views, likes, comments)
      values (v_it->>'id', (v_it->'statistics'->>'viewCount')::bigint, (v_it->'statistics'->>'likeCount')::bigint,
              (v_it->'statistics'->>'commentCount')::bigint)
      on conflict do nothing;
    end loop;
    i := i + 50;
  end loop;

  update insta.yt_runs set finished_at = now(), searched = v_searched, saved = v_saved where id = v_run;
  return jsonb_build_object('searched', v_searched, 'saved', v_saved);
end $fn$;
alter function insta.collect_youtube(int) owner to insta_owner;
revoke all on function insta.collect_youtube(int) from public, anon, authenticated, service_role;
grant execute on function insta.collect_youtube(int) to postgres;

-- 리포트: 빨리 뜨는 쇼츠, 많이 쓰인 '○○ 챌린지', 설명에 적힌 노래, 인스타 캡션에도 나오는지
create or replace function insta.yt_trend_report(p_days int default 7)
returns jsonb
language sql stable security definer
set search_path = insta, pg_temp
as $fn$
with v as (
  select y.*, s1.views, s1.collected_at,
         (select s0.views from insta.yt_snapshots s0 where s0.video_id = y.id
           and s0.collected_at < s1.collected_at - interval '12 hours' order by s0.collected_at desc limit 1) as prev_views,
         (select s0.collected_at from insta.yt_snapshots s0 where s0.video_id = y.id
           and s0.collected_at < s1.collected_at - interval '12 hours' order by s0.collected_at desc limit 1) as prev_at
  from insta.yt_videos y
  join lateral (select views, collected_at from insta.yt_snapshots s where s.video_id = y.id
                order by collected_at desc limit 1) s1 on true
  where y.published_at > now() - make_interval(days => p_days) and coalesce(y.duration_s, 0) between 1 and 180
),
vv as (
  select *, round(views / greatest(extract(epoch from (collected_at - published_at)) / 86400, 0.25))::bigint as views_per_day,
         case when prev_views is not null then
           round((views - prev_views) / greatest(extract(epoch from (collected_at - prev_at)) / 86400, 0.25))::bigint end as recent_per_day,
         coalesce(title, '') || ' ' || coalesce(array_to_string(tags, ' '), '') || ' ' || left(coalesce(description, ''), 400) as txt
  from v
),
ch as (
  select lower(regexp_replace(m[1], '\s+', '', 'g')) || '챌린지' as term, id, views
  from vv, regexp_matches(txt, '#?([0-9A-Za-z가-힣]{1,15})\s?챌린지', 'g') m
  where m[1] !~ '^(the|a|my|오늘|이번|요즘|유행|틱톡|릴스|쇼츠|숏츠|숏폼|인기|최신|댄스|노래|다양한|새로운|재밌는|재미있는|웃긴|신기한|진로|진로리더|h진로리더|챌린지)$'
    and (m[1] ~ '[가-힣]{2,}' or m[1] ~ '[A-Za-z]{3,}')
),
ch_all as (
  select c.term, count(distinct c.id) as videos, sum(c.views) as views, sum(vv.views_per_day) as views_per_day,
         (select 'https://www.youtube.com/shorts/' || c2.id from ch c2 where c2.term = c.term order by c2.views desc limit 1) as top_url
  from ch c join vv using (id) group by c.term having count(distinct c.id) >= 2
),
ch_agg as (  -- 같은 영상 묶음에서 나온 비슷한 이름(진로리더/진로)은 하나만
  select distinct on (top_url) * from ch_all order by top_url, views desc, videos desc, length(term)
),
ig as (
  select a.term, count(distinct m.username) as ig_accounts
  from ch_agg a join insta.ig_media m
    on m.posted_at > now() - make_interval(days => p_days * 2)
   and replace(lower(coalesce(m.caption, '')), ' ', '') like '%' || a.term || '%'
  group by a.term
),
songs as (
  select btrim(m[1]) as song, id, views
  from vv, regexp_matches(coalesce(description, '') || E'\n' || coalesce(title, ''),
        '(?:(?:🎵|🎶|♪|♬)\s*[:：\-]?|(?:[Bb][Gg][Mm]|[Ss]ong|[Mm]usic|노래|음악|음원|곡)\s*[:：\-])\s*([^\n#|@]{2,40})', 'g') m
),
song_agg as (
  select song, count(distinct id) as videos, sum(views) as views,
         (select 'https://www.youtube.com/shorts/' || s2.id from songs s2 where s2.song = s.song order by s2.views desc limit 1) as top_url
  from songs s where length(song) >= 2 and song !~ '^(추천|챌린지|모음|출처|원곡|있음|없음)' group by song having count(distinct id) >= 2
)
select jsonb_build_object(
  'generated_at', now(),
  'window_days', p_days,
  'last_run', (select to_jsonb(r) from (select started_at, finished_at, searched, saved, note from insta.yt_runs order by id desc limit 1) r),
  'shorts_in_window', (select count(*) from vv),
  'fast_shorts', coalesce((select jsonb_agg(x) from (
      select title, channel_title as channel, views, views_per_day, recent_per_day, published_at::date as day,
             'https://www.youtube.com/shorts/' || id as url
      from vv where title ~ '[가-힣]' order by coalesce(recent_per_day, views_per_day) desc limit 25) x), '[]'),
  'challenges', coalesce((select jsonb_agg(x) from (
      select a.term, a.videos, a.views, a.views_per_day, coalesce(ig.ig_accounts, 0) as ig_accounts, a.top_url
      from ch_agg a left join ig using (term) order by a.videos desc, a.views_per_day desc limit 20) x), '[]'),
  'songs', coalesce((select jsonb_agg(x) from (
      select song, videos, views, top_url from song_agg order by videos desc, views desc limit 20) x), '[]')
);
$fn$;
alter function insta.yt_trend_report(int) owner to insta_owner;
revoke all on function insta.yt_trend_report(int) from public, anon, authenticated, service_role;
grant execute on function insta.yt_trend_report(int) to postgres;

-- 매일 03:20 KST
select cron.unschedule('insta-youtube-daily') where exists (select 1 from cron.job where jobname = 'insta-youtube-daily');
select cron.schedule('insta-youtube-daily', '20 18 * * *', $c$select insta.collect_youtube()$c$);
