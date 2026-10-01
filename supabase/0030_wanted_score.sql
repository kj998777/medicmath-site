-- 메딕수학 홈페이지: "100점 근처가 나오는" → "원하는 점수가 나오는" (중등 수업 설명·자주 묻는 질문)
update public.site_content
set data = replace(data::text, '100점 근처가 나오는', '원하는 점수가 나오는')::jsonb,
    updated_at = now()
where id = 'main' and data::text like '%100점 근처가 나오는%';

select (data::text like '%100점 근처%') as 남은_100점_문구 from public.site_content where id = 'main';
