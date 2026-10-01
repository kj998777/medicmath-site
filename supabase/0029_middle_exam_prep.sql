-- 메딕수학 홈페이지: 중등부 문구 보완 — 시험 기간엔 내신 확실히 대비, 평소엔 개념·어려운 문제 태도
update public.site_content
set data = jsonb_set(jsonb_set(data, '{programs}',
  (select jsonb_agg(case
       when e->>'badge' in ('중1 과정','중2 과정') then e || '{"body": "시험 기간에는 학교 시험 범위를 확실하게 대비합니다. 다만 중학교 수학은 그 기간에 바짝 준비하면 100점 근처가 나오는 시험이라, 메딕수학 중등부는 내신 점수에서 멈추지 않습니다. 평소에는 정의와 원리부터 정확히 세우는 개념 수업, 그리고 처음 보는 어려운 문제 앞에서도 쉽게 답지를 펴지 않고 끝까지 붙잡는 태도를 기릅니다. 고등학교에서 성적을 가르는 힘은 여기서 만들어집니다."}'::jsonb
       when e->>'badge' = '중3 과정' then e || '{"body": "시험 기간에는 학교 내신을 확실하게 대비하고, 평소에는 중학교 개념을 정확히 마무리하면서 고등 과정을 선행합니다. 고등학교 시험지는 어려운 문항의 비중이 크게 늘어나기 때문에, 어려운 문제를 끝까지 붙잡는 습관을 고등학교에 올라가기 전에 만들어 둡니다."}'::jsonb
       else e end order by ord)
   from jsonb_array_elements(data->'programs') with ordinality as t(e, ord))),
  '{faqs}',
  (select jsonb_agg(case
       when f->>'q' = '중학교 내신 대비는 어떻게 하나요?' then '{"q": "중학교 내신 대비는 어떻게 하나요?", "a": "시험 기간에는 학교 시험 범위와 기출로 확실하게 대비합니다. 다만 중학교 수학은 시험 기간에 바짝 준비하면 100점 근처가 나오는 시험이라, 메딕수학은 내신 점수만으로 실력을 판단하지 않습니다. 평소에는 개념을 정확히 이해했는지, 처음 보는 어려운 문제를 끝까지 붙잡는지를 봅니다. 고등학교에 올라가 성적이 갈리는 건 바로 그 차이입니다."}'::jsonb
       when f->>'q' = '고등부 시험 기간에는 어떻게 수업하나요?' then '{"q": "시험 기간에는 어떻게 수업하나요?", "a": "중등부·고등부 모두 시험 기간에는 학교 시험 범위에 맞춰 내신 대비를 합니다. 특히 고등학교 내신은 학교마다 자주 나오는 단원과 어려운 문항 유형이 달라, 메딕차트에 정리된 우리 학교 기출로 학교별로 준비합니다. 시험이 끝나면 개별 성적 보고서로 결과와 다음 시험까지의 복습 순서를 알려 드립니다."}'::jsonb
       else f end order by ord)
   from jsonb_array_elements(data->'faqs') with ordinality as t(f, ord))),
    updated_at = now()
where id = 'main';

select f->>'q' as 질문 from public.site_content, jsonb_array_elements(data->'faqs') f where id = 'main';
