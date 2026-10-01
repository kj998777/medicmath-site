-- 메딕수학 홈페이지: 하단 대표·사업자등록번호 (사업자등록증 기준)
update public.site_content
set data = jsonb_set(jsonb_set(data, '{business,owner}', '"이진"'::jsonb), '{business,bizNo}', '"538-97-02143"'::jsonb),
    updated_at = now()
where id = 'main';

select data->'business' as 사업자_정보 from public.site_content where id = 'main';
