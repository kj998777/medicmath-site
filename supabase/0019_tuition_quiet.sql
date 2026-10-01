-- 메딕수학 홈페이지: 수업 카드의 큰 교습비 표시 빼기(교습비 게시는 맨 아래 작은 글씨로 유지)
update public.site_content
set data = jsonb_set(data, '{programs}',
  (select jsonb_agg(e || '{"fee":""}'::jsonb order by ord)
   from jsonb_array_elements(data->'programs') with ordinality as t(e, ord))),
    updated_at = now()
where id = 'main';

select e->>'badge' as 과정, e->>'fee' as 카드_교습비, e->>'point' as 강조
from public.site_content, jsonb_array_elements(data->'programs') e where id = 'main';
