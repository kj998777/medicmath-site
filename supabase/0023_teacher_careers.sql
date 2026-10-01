-- 메딕수학 홈페이지: 강사 약력 채우기 (아직 [학력·주요 약력] 자리 표시인 경우에만)
update public.site_content
set data = jsonb_set(data, '{teachers}',
  (select jsonb_agg(
     case
       when e->>'name' like '이진%' and e->>'career' like '[%' then e || '{"career":"수학을 가르친 지 25년"}'::jsonb
       when e->>'name' like '이은상%' and e->>'career' like '[%' then e || '{"career":"제주의대 재학\n이진 원장에게 6년간 수학을 배움\n수능 수학 96점(백분위 99)\n서울대 통계학과·포스텍·제주의대 합격"}'::jsonb
       else e
     end order by ord)
   from jsonb_array_elements(data->'teachers') with ordinality as t(e, ord))),
    updated_at = now()
where id = 'main';

select e->>'name' as 이름, e->>'career' as 약력 from public.site_content, jsonb_array_elements(data->'teachers') e where id = 'main';
