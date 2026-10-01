-- 메딕수학 홈페이지: 수업 안내에 중1·중2·중3 과정 추가 (정원 표시 없음, 중3은 고등 선행 강조)
-- 맨 앞의 빈 자리 '중등부' 카드를 빼고, 그 자리에 중1·중2·중3 과정 3개를 넣는다. 고1·고2·고3 카드는 그대로.
update public.site_content
set data = jsonb_set(
  data,
  '{programs}',
  jsonb_build_array(
    jsonb_build_object('badge','중1 과정','highlight',false,'title','학교별 내신 완성','body',data->'programs'->1->>'body','point','','schedule','','enrolled',0,'capacity',0),
    jsonb_build_object('badge','중2 과정','highlight',false,'title','학교별 내신 완성','body',data->'programs'->1->>'body','point','','schedule','','enrolled',0,'capacity',0),
    jsonb_build_object('badge','중3 과정','highlight',false,'title','학교별 내신 완성 + 고등 선행','body',data->'programs'->1->>'body','point','고등 선행 포함','schedule','','enrolled',0,'capacity',0)
  ) || ((data->'programs') - 0)
),
updated_at = now()
where id = 'main' and data->'programs'->0->>'badge' = '중등부';

select jsonb_array_length(data->'programs') as 과정_수, data->'programs'->2->>'point' as 중3_강조
from public.site_content where id = 'main';
