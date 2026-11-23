-- 인스타 수집기를 메딕차트 데이터와 분리 (2026-11-23)
-- 무료 요금제 프로젝트 수 제한으로 별도 프로젝트 대신, 같은 DB 안에서 권한으로 잠근다.
--
-- 1) ig_ 표 5개를 public → insta 스키마로 옮김 (API로 노출되지 않는 스키마)
-- 2) 표 주인은 로그인할 수 없는 전용 역할 insta_owner. 이 역할은 insta 스키마 말고는 아무 표에도 권한이 없다.
-- 3) 수집은 DB 안의 함수 insta.collect()가 http 확장으로 Meta Graph API를 직접 호출한다.
--    함수는 insta_owner 권한으로만 실행되므로(SECURITY DEFINER) 학생·시험 표를 읽거나 쓸 수 없다.
-- 4) Meta 토큰은 Supabase Vault의 meta_access_token에 선생님이 직접 넣는다. insta_owner는 그 한 값만 꺼낼 수 있다.
-- 5) Edge Function ig-collect(서비스 롤 키를 갖고 돌던 것)는 더 이상 쓰지 않는다.

-- 역할
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'insta_owner') then
    create role insta_owner nologin;
  end if;
end $$;
grant insta_owner to postgres;

-- 스키마
create schema if not exists insta authorization insta_owner;
revoke all on schema insta from public;

-- 표 옮기기 (데이터 그대로)
drop policy if exists "staff read ig_accounts" on public.ig_accounts;
drop policy if exists "staff write ig_accounts" on public.ig_accounts;
drop policy if exists "staff read ig_account_stats" on public.ig_account_stats;
drop policy if exists "staff read ig_media" on public.ig_media;
drop policy if exists "staff read ig_media_snapshots" on public.ig_media_snapshots;
drop policy if exists "staff read ig_runs" on public.ig_runs;

alter table public.ig_accounts        set schema insta;
alter table public.ig_account_stats   set schema insta;
alter table public.ig_media           set schema insta;
alter table public.ig_media_snapshots set schema insta;
alter table public.ig_runs            set schema insta;

alter table insta.ig_accounts        owner to insta_owner;
alter table insta.ig_account_stats   owner to insta_owner;
alter table insta.ig_media           owner to insta_owner;
alter table insta.ig_media_snapshots owner to insta_owner;
alter table insta.ig_runs            owner to insta_owner;

revoke all on all tables in schema insta from anon, authenticated, service_role;
revoke all on all sequences in schema insta from anon, authenticated, service_role;

-- http 확장 (동기 HTTP 호출)
create extension if not exists http with schema extensions;
grant usage on schema extensions to insta_owner;
grant execute on function extensions.http_get(character varying) to insta_owner;
grant execute on function extensions.urlencode(character varying) to insta_owner;
grant execute on function extensions.http_set_curlopt(character varying, character varying) to insta_owner;

-- Vault에서 토큰 하나만 꺼내는 함수 (insta_owner만 실행 가능)
create or replace function insta.meta_token() returns text
language sql stable security definer set search_path = ''
as $$ select decrypted_secret from vault.decrypted_secrets where name = 'meta_access_token' limit 1 $$;
revoke all on function insta.meta_token() from public, anon, authenticated, service_role;
grant execute on function insta.meta_token() to insta_owner;

-- 수집 함수
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
  if not p_force and exists (select 1 from insta.ig_runs where started_at > now() - interval '10 minutes') then
    return jsonb_build_object('skipped', '최근 10분 안에 이미 수집함');
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
    end;
  end loop;

  update insta.ig_runs set finished_at = now(), ok = v_ok, failed = v_fail where id = v_run;
  return jsonb_build_object('ok', v_ok, 'failed', v_fail, 'results', v_res);
end $fn$;

alter function insta.collect(boolean) owner to insta_owner;
revoke all on function insta.collect(boolean) from public, anon, authenticated, service_role;
grant execute on function insta.collect(boolean) to postgres;

-- 스케줄: Edge Function 호출 대신 DB 함수 직접 실행 (월·목 02:00 KST)
select cron.unschedule('ig-collect-twice-weekly')
where exists (select 1 from cron.job where jobname = 'ig-collect-twice-weekly');
select cron.schedule('insta-collect-twice-weekly', '0 17 * * 0,3', $c$select insta.collect()$c$);

-- 수집 안 되는 계정은 끔 (개인 계정이거나 아이디가 바뀜, 2026-11-23 첫 수집 결과)
update insta.ig_accounts set active = false
where username in ('woojinmath', 'miji_lee_mj', 'brand.dshw');
