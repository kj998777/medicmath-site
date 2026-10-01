-- 메딕수학 홈페이지: 학원 원칙 3개 설명 채우기 (아직 [ ] 자리 표시일 때만)
update public.site_content
set data = jsonb_set(data, '{rules}',
  (select jsonb_agg(
     case
       when ord = 1 and e->>'body' like '[%' then e || '{"body": "과제는 양보다 ''끝까지''가 기준입니다. 해 오지 못한 과제는 학원에 남아 끝내고 귀가하며, 풀이 과정 없이 답만 적은 과제는 한 것으로 보지 않습니다."}'::jsonb
       when ord = 2 and e->>'body' like '[%' then e || '{"body": "틀린 문제는 해설을 읽는 것으로 끝내지 않습니다. 해설을 덮고 다시 풀어 맞힐 때까지가 그날의 수업이고, 반복해서 틀리는 단원은 메딕차트로 따로 모아 관리합니다."}'::jsonb
       when ord = 3 and e->>'body' like '[%' then e || '{"body": "지각·결석·수업 중 휴대폰 사용은 그날 바로 학부모님께 알립니다. 실력은 시간이 걸려도 오르지만, 태도가 바뀌지 않으면 점수는 오르지 않습니다."}'::jsonb
       else e
     end order by ord)
   from jsonb_array_elements(data->'rules') with ordinality as t(e, ord))),
    updated_at = now()
where id = 'main';

select e->>'title' as 원칙, e->>'body' as 설명 from public.site_content, jsonb_array_elements(data->'rules') e where id = 'main';
