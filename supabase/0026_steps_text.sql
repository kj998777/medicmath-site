-- 메딕수학 홈페이지: 입학 절차 2·3단계 설명 채우기 (아직 [ ] 자리 표시일 때만). 첫 달 적응 기간 없음.
update public.site_content
set data = jsonb_set(data, '{steps}',
  (select jsonb_agg(
     case
       when ord = 2 and e->>'body' like '[%' then e || '{"body":"입학 테스트 진단 결과(심화·표준·기초)를 함께 보며 지금 실력과 목표를 확인합니다. 무엇보다 학생 본인이 정말 공부하기로 결심했는지 직접 묻고, 결심이 확인된 학생만 등록합니다."}'::jsonb
       when ord = 3 and e->>'body' like '[%' then e || '{"body":"따로 적응 기간 없이, 등록한 날부터 바로 정규 수업과 과제에 들어갑니다. 첫 시험부터 메딕차트로 결과를 분석해 다음 시험까지 무엇을 할지 정해 드립니다."}'::jsonb
       else e
     end order by ord)
   from jsonb_array_elements(data->'steps') with ordinality as t(e, ord))),
    updated_at = now()
where id = 'main';

select e->>'title' as 단계, e->>'body' as 설명 from public.site_content, jsonb_array_elements(data->'steps') e where id = 'main';
