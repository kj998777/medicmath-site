-- 표본을 1만 개 이상으로 (2026-11-25)
-- 유튜브: 검색어 20개 × 기간 4구간 = 하루 검색 80번(할당량 약 8,000/10,000), 최대 약 4,000개/일, 최근 7일 누적 1만~2만 개.
-- 인스타: 쇼츠 설명란의 인스타 아이디로 참고 계정을 자동으로 늘리고(팔로워 1만 이상만 남김), 하루 4번 나눠 수집(시간당 약 125회).
--         Meta 요청이 몰리면 개발자 계정이 잠긴 적이 있어(2026-11-25) 한 번에 다 부르지 않는다.

-- 1) 유튜브 검색어 표 (harvest=false인 검색어에서 나온 영상은 인스타 아이디를 뽑지 않음 — 학생 계정 보호)
create table if not exists insta.yt_queries (
  query   text primary key,
  active  boolean not null default true,
  harvest boolean not null default true
);
alter table insta.yt_queries owner to insta_owner;
revoke all on insta.yt_queries from anon, authenticated, service_role;
insert into insta.yt_queries (query, harvest) values
  ('챌린지', true), ('댄스챌린지', true), ('릴스 챌린지', true), ('요즘 유행', true), ('밈', true),
  ('유행어', true), ('상황극', true), ('웃긴영상', true), ('리액션', true), ('커버댄스', true),
  ('노래 챌린지', true), ('커플 챌린지', true), ('브이로그', true), ('공부 브이로그', false), ('수험생', false),
  ('학교', false), ('학생 챌린지', false), ('고등학생', false), ('급식', false), ('개그', true)
on conflict (query) do nothing;

-- 2) 유튜브 수집: 기간 구간별 (0: 최근 1일, 1: 1~2일 전, 2: 2~4일 전, 3: 4~7일 전)
drop function if exists insta.collect_youtube(int);
create function insta.collect_youtube(p_window int) returns jsonb
language plpgsql security definer
set search_path = insta, extensions, pg_temp
as $fn$
declare
  v_key text; v_run bigint; v_resp extensions.http_response; v_body jsonb; v_it jsonb;
  v_q text; v_after timestamptz; v_before timestamptz; v_ids text[]; v_batch text[];
  v_searched int := 0; v_saved int := 0; i int;
  c_api constant text := 'https://www.googleapis.com/youtube/v3/';
begin
  v_before := now() - case p_window when 0 then interval '0' when 1 then interval '1 day' when 2 then interval '2 days' else interval '4 days' end;
  v_after  := now() - case p_window when 0 then interval '1 day' when 1 then interval '2 days' when 2 then interval '4 days' else interval '7 days' end;
  insert into insta.yt_runs (note) values ('구간 ' || p_window) returning id into v_run;
  v_key := insta.yt_key();
  if coalesce(v_key, '') = '' then
    update insta.yt_runs set finished_at = now(), note = 'Vault에 youtube_api_key 없음' where id = v_run;
    return jsonb_build_object('error', 'Vault에 youtube_api_key 없음');
  end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');
  create temp table if not exists _yt_found (id text primary key, q text) on commit drop;
  truncate _yt_found;

  for v_q in select query from insta.yt_queries where active order by query loop
    v_resp := extensions.http_get(c_api || 'search?part=id&type=video&maxResults=50&order=viewCount'
              || '&regionCode=KR&relevanceLanguage=ko&videoDuration=short'
              || '&publishedAfter=' || extensions.urlencode(to_char(v_after at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
              || '&publishedBefore=' || extensions.urlencode(to_char(v_before at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
              || '&q=' || extensions.urlencode(v_q) || '&key=' || extensions.urlencode(v_key));
    v_body := v_resp.content::jsonb;
    if v_resp.status <> 200 then
      update insta.yt_runs set note = left(note || ' / ' || v_q || ': '
        || coalesce(v_body->'error'->>'message', 'HTTP ' || v_resp.status), 1000) where id = v_run;
      exit when v_body->'error'->>'message' ilike '%quota%';   -- 할당량 다 쓰면 멈춤
      continue;
    end if;
    for v_it in select * from jsonb_array_elements(coalesce(v_body->'items', '[]')) loop
      insert into _yt_found values (v_it->'id'->>'videoId', v_q) on conflict do nothing;
    end loop;
  end loop;
  select count(*) into v_searched from _yt_found;

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

  update insta.yt_runs set finished_at = now(), searched = v_searched, saved = v_saved where id = v_run;
  return jsonb_build_object('window', p_window, 'searched', v_searched, 'saved', v_saved);
end $fn$;
alter function insta.collect_youtube(int) owner to insta_owner;
revoke all on function insta.collect_youtube(int) from public, anon, authenticated, service_role;
grant execute on function insta.collect_youtube(int) to postgres;

-- 3) 최근 10일 영상 조회수 다시 재기 (50개당 할당량 1)
create or replace function insta.refresh_youtube_stats() returns jsonb
language plpgsql security definer
set search_path = insta, extensions, pg_temp
as $fn$
declare v_key text; v_ids text[]; v_batch text[]; v_resp extensions.http_response; v_body jsonb; v_it jsonb; i int := 1; v_n int := 0;
begin
  v_key := insta.yt_key();
  if coalesce(v_key, '') = '' then return jsonb_build_object('error', 'Vault에 youtube_api_key 없음'); end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');
  select array_agg(id) into v_ids from insta.yt_videos where published_at > now() - interval '10 days';
  while v_ids is not null and i <= array_length(v_ids, 1) loop
    v_batch := v_ids[i:i + 49];
    v_resp := extensions.http_get('https://www.googleapis.com/youtube/v3/videos?part=statistics&id='
              || extensions.urlencode(array_to_string(v_batch, ',')) || '&key=' || extensions.urlencode(v_key));
    v_body := v_resp.content::jsonb;
    exit when v_resp.status <> 200;
    for v_it in select * from jsonb_array_elements(coalesce(v_body->'items', '[]')) loop
      insert into insta.yt_snapshots (video_id, views, likes, comments)
      values (v_it->>'id', (v_it->'statistics'->>'viewCount')::bigint, (v_it->'statistics'->>'likeCount')::bigint,
              (v_it->'statistics'->>'commentCount')::bigint)
      on conflict do nothing;
      v_n := v_n + 1;
    end loop;
    i := i + 50;
  end loop;
  return jsonb_build_object('refreshed', v_n);
end $fn$;
alter function insta.refresh_youtube_stats() owner to insta_owner;
revoke all on function insta.refresh_youtube_stats() from public, anon, authenticated, service_role;
grant execute on function insta.refresh_youtube_stats() to postgres;

-- 4) 쇼츠 설명란에서 인스타 아이디 뽑아 참고 계정 후보로 추가 (조회수 10만 이상 영상, 학생 검색어 제외, 자동 계정 최대 400개)
create or replace function insta.harvest_ig_handles(p_max int default 60) returns jsonb
language plpgsql security definer set search_path = insta, pg_temp
as $fn$
declare v_room int; v_added int;
begin
  select 400 - count(*) into v_room from insta.ig_accounts where category = '쇼츠크리에이터(자동)' and active;
  if v_room <= 0 then return jsonb_build_object('skipped', '자동 계정 400개 다 참'); end if;
  with src as (
    select y.id, y.description, s.views
    from insta.yt_videos y
    join insta.yt_queries q on q.query = y.query and q.harvest
    join lateral (select views from insta.yt_snapshots s where s.video_id = y.id order by collected_at desc limit 1) s on true
    where y.first_seen > now() - interval '14 days' and y.title ~ '[가-힣]' and s.views >= 100000
  ),
  h as (
    select lower(rtrim(m[1], '.')) as handle, max(views) as views, (array_agg(id order by views desc))[1] as vid
    from src, regexp_matches(coalesce(description, ''),
         '(?:instagram\.com/|(?:인스타그램|인스타|instagram|insta|IG)\s*[:：|]?\s*@)([A-Za-z0-9._]{2,30})', 'gi') m
    group by 1
  ),
  ins as (
    insert into insta.ig_accounts (username, category, note)
    select handle, '쇼츠크리에이터(자동)', 'yt:' || vid
    from h
    where handle ~ '^[a-z0-9._]{1,30}$'
      and handle not in ('p', 'reel', 'reels', 'explore', 'stories', 'accounts', 'tv', 'direct')
      and not exists (select 1 from insta.ig_accounts a where a.username = h.handle)
    order by views desc
    limit least(p_max, v_room)
    returning 1
  )
  select count(*) into v_added from ins;
  return jsonb_build_object('added', v_added);
end $fn$;
alter function insta.harvest_ig_handles(int) owner to insta_owner;
revoke all on function insta.harvest_ig_handles(int) from public, anon, authenticated, service_role;
grant execute on function insta.harvest_ig_handles(int) to postgres;

-- 5) 인스타 수집: 4등분해서 나눠 돌림, 없는 계정·작은 자동 계정은 자동으로 끔
alter table insta.ig_runs add column if not exists chunk int;
drop function if exists insta.collect(boolean);
create function insta.collect(p_force boolean default false, p_chunk int default null, p_chunks int default 4) returns jsonb
language plpgsql security definer
set search_path = insta, extensions, pg_temp
as $fn$
declare
  v_tok text; v_me text; v_run bigint; v_ok int := 0; v_fail int := 0; v_off int := 0; v_n int;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_res jsonb := '{}'::jsonb; r record; v_resp extensions.http_response;
  v_body jsonb; v_bd jsonb; v_m jsonb; v_fields text; v_msg text; v_followers int;
  c_graph constant text := 'https://graph.facebook.com/v23.0/';
begin
  if not p_force and exists (select 1 from insta.ig_runs where started_at > now() - interval '50 minutes') then
    return jsonb_build_object('skipped', '최근 50분 안에 이미 수집함 (Meta 요청 한도 보호)');
  end if;
  insert into insta.ig_runs (chunk) values (p_chunk) returning id into v_run;

  v_tok := insta.meta_token();
  if coalesce(v_tok, '') = '' then
    update insta.ig_runs set finished_at = now(), note = 'Vault에 meta_access_token 없음' where id = v_run;
    return jsonb_build_object('error', 'Vault에 meta_access_token 없음');
  end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');

  begin
    v_me := insta.my_ig_id(v_tok);
  exception when others then
    update insta.ig_runs set finished_at = now(), note = left(sqlerrm, 300) where id = v_run;
    return jsonb_build_object('error', left(sqlerrm, 300));
  end;

  for r in select username, category from insta.ig_accounts
           where active and (p_chunk is null or abs(hashtext(username)) % p_chunks = p_chunk)
           order by username limit 160 loop
    begin
      v_fields := 'business_discovery.username(' || r.username || '){username,name,biography,followers_count,media_count,'
               || 'media.limit(30){id,caption,like_count,comments_count,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url}}';
      v_resp := extensions.http_get(c_graph || v_me || '?fields=' || extensions.urlencode(v_fields)
                || '&access_token=' || extensions.urlencode(v_tok));
      v_body := v_resp.content::jsonb;
      if v_resp.status <> 200 or v_body ? 'error' then
        raise exception '%', coalesce(v_body->'error'->>'message', 'HTTP ' || v_resp.status);
      end if;
      v_bd := v_body->'business_discovery';
      v_followers := (v_bd->>'followers_count')::int;

      -- 자동으로 넣은 계정은 팔로워 1만 이상만 남긴다 (작은 개인 계정 보호)
      if r.category = '쇼츠크리에이터(자동)' and coalesce(v_followers, 0) < 10000 then
        update insta.ig_accounts set active = false, last_status = '팔로워 1만 미만(자동 제외)', last_checked = now() where username = r.username;
        v_off := v_off + 1;
        continue;
      end if;

      insert into insta.ig_account_stats (username, collected_on, name, biography, followers_count, media_count)
      values (r.username, v_today, v_bd->>'name', v_bd->>'biography', v_followers, (v_bd->>'media_count')::int)
      on conflict (username, collected_on) do update set name = excluded.name, biography = excluded.biography,
        followers_count = excluded.followers_count, media_count = excluded.media_count;

      v_n := 0;
      for v_m in select * from jsonb_array_elements(coalesce(v_bd->'media'->'data', '[]'::jsonb)) loop
        insert into insta.ig_media (id, username, media_type, media_product_type, caption, permalink, posted_at,
                                    thumbnail_url, media_url, like_count, comments_count, updated_at)
        values (v_m->>'id', r.username, v_m->>'media_type', v_m->>'media_product_type', v_m->>'caption', v_m->>'permalink',
                (v_m->>'timestamp')::timestamptz, v_m->>'thumbnail_url', v_m->>'media_url',
                (v_m->>'like_count')::int, (v_m->>'comments_count')::int, now())
        on conflict (id) do update set caption = excluded.caption, like_count = excluded.like_count,
          comments_count = excluded.comments_count, thumbnail_url = excluded.thumbnail_url, media_url = excluded.media_url,
          media_product_type = excluded.media_product_type, updated_at = now();
        insert into insta.ig_media_snapshots (media_id, collected_on, like_count, comments_count)
        values (v_m->>'id', v_today, (v_m->>'like_count')::int, (v_m->>'comments_count')::int)
        on conflict (media_id, collected_on) do update set like_count = excluded.like_count, comments_count = excluded.comments_count;
        v_n := v_n + 1;
      end loop;

      update insta.ig_accounts set last_status = 'ok', last_checked = now() where username = r.username;
      v_ok := v_ok + 1;
    exception when others then
      v_msg := left(sqlerrm, 300);
      update insta.ig_accounts set last_status = v_msg, last_checked = now(),
        active = case when v_msg ilike '%invalid user id%' or v_msg ilike '%cannot find%' or v_msg ilike '%does not exist%' then false else active end
      where username = r.username;
      v_res := v_res || jsonb_build_object(r.username, v_msg);
      v_fail := v_fail + 1;
      exit when v_msg ilike '%request limit%' or v_msg ilike '%blocked%';   -- 한도·차단이면 바로 멈춤
    end;
  end loop;

  update insta.ig_runs set finished_at = now(), ok = v_ok, failed = v_fail,
    note = case when v_off > 0 then '작은 자동 계정 ' || v_off || '개 제외' end where id = v_run;
  return jsonb_build_object('chunk', p_chunk, 'ok', v_ok, 'failed', v_fail, 'auto_off', v_off, 'errors', v_res);
end $fn$;
alter function insta.collect(boolean, int, int) owner to insta_owner;
revoke all on function insta.collect(boolean, int, int) from public, anon, authenticated, service_role;
grant execute on function insta.collect(boolean, int, int) to postgres;

-- 6) 일정 (KST): 01·02·05·06시 인스타 4등분, 03:20~03:50 유튜브 4구간, 04:00 아이디 뽑기, 04:10 해시태그, 15:20 유튜브 조회수 재측정
do $$
declare j text;
begin
  foreach j in array array['insta-collect-twice-weekly', 'insta-youtube-daily', 'insta-ig-c0', 'insta-ig-c1', 'insta-ig-c2', 'insta-ig-c3',
                           'insta-yt-w0', 'insta-yt-w1', 'insta-yt-w2', 'insta-yt-w3', 'insta-yt-refresh', 'insta-harvest'] loop
    perform cron.unschedule(j) where exists (select 1 from cron.job where jobname = j);
  end loop;
end $$;
select cron.schedule('insta-ig-c0', '0 16 * * *',  $c$select insta.collect(false, 0, 4)$c$);
select cron.schedule('insta-ig-c1', '0 17 * * *',  $c$select insta.collect(false, 1, 4)$c$);
select cron.schedule('insta-ig-c2', '0 20 * * *',  $c$select insta.collect(false, 2, 4)$c$);
select cron.schedule('insta-ig-c3', '0 21 * * *',  $c$select insta.collect(false, 3, 4)$c$);
select cron.schedule('insta-yt-w0', '20 18 * * *', $c$select insta.collect_youtube(0)$c$);
select cron.schedule('insta-yt-w1', '30 18 * * *', $c$select insta.collect_youtube(1)$c$);
select cron.schedule('insta-yt-w2', '40 18 * * *', $c$select insta.collect_youtube(2)$c$);
select cron.schedule('insta-yt-w3', '50 18 * * *', $c$select insta.collect_youtube(3)$c$);
select cron.schedule('insta-harvest', '0 19 * * *', $c$select insta.harvest_ig_handles(60)$c$);
select cron.schedule('insta-yt-refresh', '20 6 * * *', $c$select insta.refresh_youtube_stats()$c$);

-- 7) 유튜브 채널 소개에서도 인스타 아이디를 찾는다 (영상 설명보다 훨씬 자주 적혀 있음)
--    실제 적용본: Supabase 마이그레이션 yt_channels_harvest, harvest_strict_handles (2026-11-25)
--    - insta.yt_channels(id, title, description, subscribers, country, fetched_at)
--    - insta.fetch_yt_channels(): 조회수 3만 이상 영상이 있는 한국어 채널 최대 2,000개, 30일마다 갱신 (50개당 할당량 1). 매일 03:56 KST
--    - insta.harvest_ig_handles(): 영상 설명(조회수 3만 이상) + 채널 소개(구독자 1만 이상)에서
--      'instagram.com/아이디' 또는 '인스타/instagram/IG' 바로 뒤 '@아이디'만 인정(그냥 단어가 잡히는 것 방지). 하루 60개, 자동 계정 최대 400개.
