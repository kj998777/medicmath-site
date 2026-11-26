-- 메딕수학 홈페이지: 고3 수능대비 특강 카드 내리기 + 예비고1 카드(3/5) 추가 (2026-11-26, 수능 종료)
update public.site_content
set data = jsonb_set(data, '{programs}',
  (select jsonb_agg(e order by k)
   from (
     select e, case when e->>'badge' like '중%' then ord else ord + 1 end as k
       from jsonb_array_elements(data->'programs') with ordinality t(e, ord)
      where e->>'badge' <> '고3'
     union all
     select jsonb_build_object(
       'badge','예비고1','title','고1 과정 선행 · 고등학교 첫 시험 준비',
       'body','중학교 개념의 빈틈을 점검하고, 고1 공통수학을 정확한 개념부터 진도를 나갑니다. 메딕수학 자체 개발 학교별 기출분석 시스템 ''메딕차트''로 제주 고등학교 기출을 미리 다뤄, 고등학교 첫 시험을 흔들림 없이 준비합니다.',
       'point','주말 5시간씩','schedule','토·일 10:00~15:00','fee','',
       'capacity',5,'enrolled',3,'highlight',true), 3.5
   ) s(e, k))),
  updated_at = now()
where id = 'main';
