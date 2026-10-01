-- 메딕수학 홈페이지: 중등 과정 카드에서 '주 5회' 빼기
update public.site_content
set data = jsonb_set(data, '{programs}',
  (select jsonb_agg(case when e->>'badge' like '중%' then e || '{"schedule":""}'::jsonb else e end order by ord)
   from jsonb_array_elements(data->'programs') with ordinality as t(e, ord))),
    updated_at = now()
where id = 'main';
