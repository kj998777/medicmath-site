-- 메딕수학 홈페이지: 입학 신청에 학부모 연락처 추가 (기존 phone = 학생 연락처)
-- 예전 신청은 비어 있을 수 있어 열 자체는 null 허용, 사이트 신청서에서는 필수로 받는다.
alter table public.admission_requests
  add column if not exists parent_phone text
  check (parent_phone is null or char_length(parent_phone) between 9 and 20);

select column_name, is_nullable from information_schema.columns
where table_schema = 'public' and table_name = 'admission_requests' and column_name in ('phone', 'parent_phone');
