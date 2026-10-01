-- 메딕수학 홈페이지: 성적 향상 사례 학년 앞에 "당시"
update public.site_content
set data = jsonb_set(data, '{cases}',
  (select jsonb_agg(case
       when c->>'who' = '강OO · 제주시 중2' then c || '{"who":"강OO · 당시 제주시 중2"}'::jsonb
       when c->>'who' = '이은상 강사 본인 · 사대부고 고3' then c || '{"who":"이은상 강사 본인 · 당시 사대부고 고3"}'::jsonb
       when c->>'who' = '박OO · 고1' then c || '{"who":"박OO · 당시 고1"}'::jsonb
       else c end order by ord)
   from jsonb_array_elements(data->'cases') with ordinality as t(c, ord))),
    updated_at = now()
where id = 'main';

select c->>'who' as 학생 from public.site_content, jsonb_array_elements(data->'cases') c where id = 'main';
