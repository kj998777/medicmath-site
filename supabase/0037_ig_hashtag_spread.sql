-- 쇼츠에서 잡힌 챌린지가 인스타에서도 퍼지는지 해시태그로 확인 (2026-11-25)
-- Graph API ig_hashtag_search → recent_media(최근 24시간) / top_media(인기)를 공식 경로로 조회한다.
-- Meta 제한: 한 인스타 계정이 7일 동안 검색할 수 있는 새 해시태그는 30개 → 여기선 25개까지만 쓴다.
-- 같은 날 Meta 개발자 계정이 '비정상 활동'으로 잠긴 일이 있어, 수집기도 몰아서 부르지 않게 고친다.

create table if not exists insta.ig_hashtags (
  tag         text primary key,
  hashtag_id  text,
  searched_at timestamptz not null default now(),
  source      text            -- youtube / manual
);

create table if not exists insta.ig_hashtag_media (
  tag            text not null references insta.ig_hashtags(tag) on delete cascade,
  media_id       text not null,
  kind           text,          -- recent / top
  caption        text,
  media_type     text,
  like_count     integer,
  comments_count integer,
  posted_at      timestamptz,
  permalink      text,
  first_seen     timestamptz not null default now(),
  last_seen      timestamptz not null default now(),
  primary key (tag, media_id)
);

create table if not exists insta.ig_hashtag_checks (
  tag          text not null references insta.ig_hashtags(tag) on delete cascade,
  checked_at   timestamptz not null default now(),
  recent_24h   integer,       -- 최근 24시간 게시물 수(최대 50까지 셈)
  top_fresh    integer,       -- 인기 게시물 중 최근 14일 안에 올라온 것
  top_max_like integer,
  note         text,
  primary key (tag, checked_at)
);

alter table insta.ig_hashtags       owner to insta_owner;
alter table insta.ig_hashtag_media  owner to insta_owner;
alter table insta.ig_hashtag_checks owner to insta_owner;
revoke all on insta.ig_hashtags, insta.ig_hashtag_media, insta.ig_hashtag_checks from anon, authenticated, service_role;

drop function if exists insta.probe_hashtag(text);

-- 우리 인스타 계정 id (collect()와 같은 방식)
create or replace function insta.my_ig_id(p_tok text) returns text
language plpgsql security definer set search_path = insta, extensions, pg_temp
as $fn$
declare v_resp extensions.http_response; v_body jsonb; v_me text;
begin
  v_resp := extensions.http_get('https://graph.facebook.com/v23.0/me/accounts?fields='
            || extensions.urlencode('instagram_business_account{id,username}') || '&limit=50&access_token=' || extensions.urlencode(p_tok));
  v_body := v_resp.content::jsonb;
  select coalesce(
    (select e->'instagram_business_account'->>'id' from jsonb_array_elements(coalesce(v_body->'data', '[]')) e
      where e->'instagram_business_account'->>'username' = 'medic_math' limit 1),
    (select e->'instagram_business_account'->>'id' from jsonb_array_elements(coalesce(v_body->'data', '[]')) e
      where e ? 'instagram_business_account' limit 1)) into v_me;
  if v_me is null then
    raise exception '내 계정 ID 찾기 실패: %', coalesce(v_body->'error'->>'message', left(v_resp.content, 200));
  end if;
  return v_me;
end $fn$;
alter function insta.my_ig_id(text) owner to insta_owner;
revoke all on function insta.my_ig_id(text) from public, anon, authenticated, service_role;

-- 해시태그 확인
create or replace function insta.check_hashtags(p_tags text[], p_source text default 'manual') returns jsonb
language plpgsql security definer
set search_path = insta, extensions, pg_temp
as $fn$
declare
  v_tok text; v_me text; v_tag text; v_hid text; v_resp extensions.http_response; v_body jsonb; v_m jsonb;
  v_res jsonb := '{}'; v_new_week int; v_recent int; v_top_fresh int; v_top_max int; v_kind text;
  c_graph constant text := 'https://graph.facebook.com/v23.0/';
  c_fields constant text := 'id,caption,media_type,like_count,comments_count,timestamp,permalink';
begin
  v_tok := insta.meta_token();
  if coalesce(v_tok, '') = '' then return jsonb_build_object('error', 'Vault에 meta_access_token 없음'); end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');
  v_me := insta.my_ig_id(v_tok);

  foreach v_tag in array p_tags loop
    v_tag := lower(regexp_replace(v_tag, '[#\s]', '', 'g'));
    continue when v_tag = '';
    begin
      v_hid := null;
      select hashtag_id into v_hid from insta.ig_hashtags where tag = v_tag;
      if found and v_hid is null and exists (select 1 from insta.ig_hashtags where tag = v_tag and searched_at > now() - interval '7 days') then
        v_res := v_res || jsonb_build_object(v_tag, '인스타에 없는 해시태그 (7일 뒤 다시 검색)');
        continue;
      end if;
      if v_hid is null then
        select count(*) into v_new_week from insta.ig_hashtags where searched_at > now() - interval '7 days';
        if v_new_week >= 25 then
          v_res := v_res || jsonb_build_object(v_tag, '이번 주 새 해시태그 한도(25개) 다 씀');
          continue;
        end if;
        v_resp := extensions.http_get(c_graph || 'ig_hashtag_search?user_id=' || v_me || '&q=' || extensions.urlencode(v_tag)
                  || '&access_token=' || extensions.urlencode(v_tok));
        v_body := v_resp.content::jsonb;
        if v_body ? 'error' then raise exception '%', v_body->'error'->>'message'; end if;
        v_hid := v_body->'data'->0->>'id';
        insert into insta.ig_hashtags (tag, hashtag_id, source) values (v_tag, v_hid, p_source)
        on conflict (tag) do update set hashtag_id = excluded.hashtag_id, searched_at = now();
        if v_hid is null then raise exception '해시태그 없음'; end if;
      end if;

      v_recent := 0; v_top_fresh := 0; v_top_max := 0;
      foreach v_kind in array array['recent', 'top'] loop
        v_resp := extensions.http_get(c_graph || v_hid || '/' || v_kind || '_media?user_id=' || v_me
                  || '&fields=' || extensions.urlencode(c_fields) || '&limit=50&access_token=' || extensions.urlencode(v_tok));
        v_body := v_resp.content::jsonb;
        if v_body ? 'error' then raise exception '%', v_body->'error'->>'message'; end if;
        for v_m in select * from jsonb_array_elements(coalesce(v_body->'data', '[]')) loop
          insert into insta.ig_hashtag_media (tag, media_id, kind, caption, media_type, like_count, comments_count, posted_at, permalink)
          values (v_tag, v_m->>'id', v_kind, left(v_m->>'caption', 1000), v_m->>'media_type', (v_m->>'like_count')::int,
                  (v_m->>'comments_count')::int, (v_m->>'timestamp')::timestamptz, v_m->>'permalink')
          on conflict (tag, media_id) do update set like_count = excluded.like_count, comments_count = excluded.comments_count,
            last_seen = now(), kind = case when insta.ig_hashtag_media.kind = 'top' then 'top' else excluded.kind end;
          if v_kind = 'recent' and (v_m->>'timestamp')::timestamptz > now() - interval '24 hours' then v_recent := v_recent + 1; end if;
          if v_kind = 'top' and (v_m->>'timestamp')::timestamptz > now() - interval '14 days' then v_top_fresh := v_top_fresh + 1; end if;
          if v_kind = 'top' then v_top_max := greatest(v_top_max, coalesce((v_m->>'like_count')::int, 0)); end if;
        end loop;
      end loop;
      insert into insta.ig_hashtag_checks (tag, recent_24h, top_fresh, top_max_like) values (v_tag, v_recent, v_top_fresh, v_top_max);
      v_res := v_res || jsonb_build_object(v_tag, jsonb_build_object('recent_24h', v_recent, 'top_fresh', v_top_fresh));
    exception when others then
      if sqlerrm ilike '%does not exist%' or sqlerrm = '해시태그 없음' then   -- 없는 해시태그도 기록해 둬야 매일 다시 검색(주 30개 한도 소모)하지 않음
        insert into insta.ig_hashtags (tag, hashtag_id, source) values (v_tag, null, p_source)
        on conflict (tag) do update set hashtag_id = null, searched_at = now();
      end if;
      insert into insta.ig_hashtag_checks (tag, note)
      select v_tag, left(sqlerrm, 300) where exists (select 1 from insta.ig_hashtags where tag = v_tag);
      v_res := v_res || jsonb_build_object(v_tag, left(sqlerrm, 200));
      exit when sqlerrm ilike '%request limit%' or sqlerrm ilike '%blocked%';   -- 한도·차단이면 바로 멈춤
    end;
  end loop;
  return v_res;
end $fn$;
alter function insta.check_hashtags(text[], text) owner to insta_owner;
revoke all on function insta.check_hashtags(text[], text) from public, anon, authenticated, service_role;
grant execute on function insta.check_hashtags(text[], text) to postgres;

-- 쇼츠 챌린지 상위 + 이미 확인 중인 해시태그를 매일 다시 확인
create or replace function insta.check_trending_on_ig() returns jsonb
language plpgsql security definer set search_path = insta, pg_temp
as $fn$
declare v_tags text[];
begin
  select array_agg(term) into v_tags from (
    select x->>'term' as term
    from jsonb_array_elements(insta.yt_trend_report(7)->'challenges') x
    where (x->>'views')::bigint >= 50000
    order by (x->>'views_per_day')::bigint desc limit 8
  ) a;
  v_tags := coalesce(v_tags, '{}') || coalesce((select array_agg(tag) from insta.ig_hashtags
              where tag in (select tag from insta.ig_hashtag_checks where checked_at > now() - interval '14 days' and recent_24h > 0)), '{}');
  select array_agg(distinct t) into v_tags from unnest(v_tags) t;
  if v_tags is null then return jsonb_build_object('skipped', '확인할 해시태그 없음'); end if;
  return insta.check_hashtags(v_tags, 'youtube');
end $fn$;
alter function insta.check_trending_on_ig() owner to insta_owner;
revoke all on function insta.check_trending_on_ig() from public, anon, authenticated, service_role;
grant execute on function insta.check_trending_on_ig() to postgres;

-- 리포트: 해시태그별 최근 24시간 게시물 수 변화
create or replace function insta.ig_hashtag_report(p_days int default 8) returns jsonb
language sql stable security definer set search_path = insta, pg_temp
as $fn$
with c as (
  select tag, checked_at, recent_24h, top_fresh, top_max_like, note,
         row_number() over (partition by tag order by checked_at desc) as rn
  from insta.ig_hashtag_checks where checked_at > now() - make_interval(days => p_days)
),
t as (
  select l.tag, l.recent_24h as now_24h, f.recent_24h as first_24h, l.top_fresh, l.top_max_like, l.note,
         (select count(*) from c c2 where c2.tag = l.tag) as checks,
         (select permalink from insta.ig_hashtag_media m where m.tag = l.tag and m.posted_at > now() - interval '14 days'
           order by m.like_count desc nulls last limit 1) as best_recent_post
  from c l
  left join lateral (select recent_24h from c f where f.tag = l.tag order by checked_at asc limit 1) f on true
  where l.rn = 1
)
select jsonb_build_object(
  'generated_at', now(),
  'new_tags_this_week', (select count(*) from insta.ig_hashtags where searched_at > now() - interval '7 days'),
  'tags', coalesce((select jsonb_agg(t order by coalesce(now_24h, 0) desc) from t), '[]')
);
$fn$;
alter function insta.ig_hashtag_report(int) owner to insta_owner;
revoke all on function insta.ig_hashtag_report(int) from public, anon, authenticated, service_role;
grant execute on function insta.ig_hashtag_report(int) to postgres;

-- 매일 04:10 KST (쇼츠 수집 03:20 다음)
select cron.unschedule('insta-hashtag-daily') where exists (select 1 from cron.job where jobname = 'insta-hashtag-daily');
select cron.schedule('insta-hashtag-daily', '10 19 * * *', $c$select insta.check_trending_on_ig()$c$);

-- 수집기: 1시간 안에 다시 부르면 건너뛰고, 한도·차단 오류가 나면 바로 멈춤
create or replace function insta.collect(p_force boolean default false) returns jsonb
language plpgsql security definer
set search_path = insta, extensions, pg_temp
as $fn$
declare
  v_tok text; v_me text; v_run bigint; v_ok int := 0; v_fail int := 0; v_n int;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_res jsonb := '{}'::jsonb; r record; v_resp extensions.http_response;
  v_body jsonb; v_bd jsonb; v_m jsonb; v_fields text; v_msg text;
  c_graph constant text := 'https://graph.facebook.com/v23.0/';
begin
  if not p_force and exists (select 1 from insta.ig_runs where started_at > now() - interval '60 minutes') then
    return jsonb_build_object('skipped', '최근 1시간 안에 이미 수집함 (Meta 요청 한도 보호)');
  end if;
  insert into insta.ig_runs default values returning id into v_run;

  v_tok := insta.meta_token();
  if coalesce(v_tok, '') = '' then
    update insta.ig_runs set finished_at = now(), note = 'Vault에 meta_access_token 없음' where id = v_run;
    return jsonb_build_object('error', 'Vault에 meta_access_token 없음');
  end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');

  -- 우리 인스타 계정 ID 찾기
  v_resp := extensions.http_get(c_graph || 'me/accounts?fields=' || extensions.urlencode('instagram_business_account{id,username}')
            || '&limit=50&access_token=' || extensions.urlencode(v_tok));
  v_body := v_resp.content::jsonb;
  select coalesce(
    (select e->'instagram_business_account'->>'id' from jsonb_array_elements(coalesce(v_body->'data', '[]')) e
      where e->'instagram_business_account'->>'username' = 'medic_math' limit 1),
    (select e->'instagram_business_account'->>'id' from jsonb_array_elements(coalesce(v_body->'data', '[]')) e
      where e ? 'instagram_business_account' limit 1)
  ) into v_me;
  if v_me is null then
    update insta.ig_runs set finished_at = now(),
      note = left('내 계정 ID 찾기 실패: ' || coalesce(v_body->'error'->>'message', v_resp.content), 300) where id = v_run;
    return jsonb_build_object('error', '내 계정 ID 찾기 실패');
  end if;

  for r in select username from insta.ig_accounts where active order by username loop
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

      insert into insta.ig_account_stats (username, collected_on, name, biography, followers_count, media_count)
      values (r.username, v_today, v_bd->>'name', v_bd->>'biography', (v_bd->>'followers_count')::int, (v_bd->>'media_count')::int)
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
      v_res := v_res || jsonb_build_object(r.username, 'ok (' || v_n || ')');
      v_ok := v_ok + 1;
    exception when others then
      v_msg := left(sqlerrm, 300);
      update insta.ig_accounts set last_status = v_msg, last_checked = now() where username = r.username;
      v_res := v_res || jsonb_build_object(r.username, v_msg);
      v_fail := v_fail + 1;
      -- 요청 한도·차단이면 남은 계정은 다음 정기 수집으로 넘기고 바로 멈춘다 (계속 두드리면 개발자 계정이 잠길 수 있음)
      exit when v_msg ilike '%request limit%' or v_msg ilike '%blocked%';
    end;
  end loop;

  update insta.ig_runs set finished_at = now(), ok = v_ok, failed = v_fail where id = v_run;
  return jsonb_build_object('ok', v_ok, 'failed', v_fail, 'results', v_res);
end $fn$;

alter function insta.collect(boolean) owner to insta_owner;
revoke all on function insta.collect(boolean) from public, anon, authenticated, service_role;
grant execute on function insta.collect(boolean) to postgres;
