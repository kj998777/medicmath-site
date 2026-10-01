-- 메딕수학 홈페이지: 이진 원장 약력 (원장님이 알려 준 그대로)
update public.site_content
set data = jsonb_set(data, '{teachers}',
  (select jsonb_agg(
     case when e->>'name' like '이진%'
       then e || '{"career":"멘토아카데미 원장(직강)\n잇츠학원 원장(직강)\n메딕수학 원장(직강)\n누적 수강생 1,000명 돌파"}'::jsonb
       else e end order by ord)
   from jsonb_array_elements(data->'teachers') with ordinality as t(e, ord))),
    updated_at = now()
where id = 'main';

select e->>'name' as 이름, e->>'career' as 약력 from public.site_content, jsonb_array_elements(data->'teachers') e where id = 'main';
