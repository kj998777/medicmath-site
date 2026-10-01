-- 0022 블로그 링크(2026-10-01 원장님 요청: 홍보사이트·블로그 링크 연결)
-- 하단 "블로그"와 위쪽 메뉴 "블로그"가 원장님 네이버 블로그로 가게 한다. 비어 있을 때만 채운다(관리자에서 이미 넣었으면 그대로).
update public.site_content
   set data = jsonb_set(coalesce(data, '{}'::jsonb), '{links,blog}', to_jsonb('https://blog.naver.com/yijean'::text), true),
       updated_at = now()
 where id = 'main'
   and coalesce(data #>> '{links,blog}', '') = '';

-- 확인용
select data #>> '{links,blog}' as 블로그, updated_at from public.site_content where id = 'main';
