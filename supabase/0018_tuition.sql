-- 메딕수학 홈페이지: 교습비(교육청 등록 제2979호, 2026-05-08 적용) 표시 + 고등부 주말 5시간씩 강조
update public.site_content
set data = jsonb_set(jsonb_set(jsonb_set(
  data,
  '{programs}',
  (select jsonb_agg(
     case
       when e->>'badge' like '중%' then e || '{"schedule":"주 5회","fee":"월 350,000원"}'::jsonb
       when e->>'badge' like '고%' then e || '{"schedule":"토·일 · 회당 5시간","fee":"월 450,000원","point":"주말 5시간씩"}'::jsonb
       else e
     end order by ord)
   from jsonb_array_elements(data->'programs') with ordinality as t(e, ord))
),
  '{tuition}',
  '{"rows":[
     {"subject":"중등보습(수학)","schedule":"주 5회","minutes":"2,410분","fee":"350,000원"},
     {"subject":"고등보습(수학)","schedule":"주 5회","minutes":"2,730분","fee":"450,000원"},
     {"subject":"고등보습(수학)","schedule":"주 2회","minutes":"2,730분","fee":"450,000원"}],
    "appliedFrom":"2026-05-08",
    "note":"교습비 외의 기타 경비(모의고사비, 재료비, 급식비 등)는 징수하지 않습니다."}'::jsonb
),
  '{business,academyNo}', '"제2979호"'::jsonb
),
updated_at = now()
where id = 'main';

select e->>'badge' as 과정, e->>'schedule' as 시간, e->>'fee' as 교습비, e->>'point' as 강조, e->>'capacity' as 정원
from public.site_content, jsonb_array_elements(data->'programs') e where id = 'main';
