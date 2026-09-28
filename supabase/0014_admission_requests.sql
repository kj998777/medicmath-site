-- 메딕수학 홍보사이트: 입학 테스트 신청 저장 테이블
-- 메딕차트(medicchart)와 같은 Supabase 프로젝트의 SQL Editor에서 한 번 실행한다.
--
-- 권한 설계
--   · 익명 방문자(anon): INSERT만 가능. 읽기/수정/삭제 불가 → 남의 신청 내용을 볼 수 없음.
--   · 메딕차트 admin/editor: 조회·상태 변경 가능 (관리자 화면에서 확인용).
--   · 그 외(viewer, tutor, 대기): 접근 불가.

create table if not exists public.admission_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  student_name  text not null check (char_length(student_name) between 1 and 30),
  school_grade  text not null check (char_length(school_grade) between 1 and 50),
  phone         text not null check (char_length(phone) between 9 and 20),
  recent_score  text check (recent_score is null or char_length(recent_score) <= 50),
  reason        text not null check (char_length(reason) between 10 and 1000),
  status        text not null default '신규' check (status in ('신규', '연락완료', '테스트예정', '입학', '보류')),
  memo          text
);

create index if not exists admission_requests_created_at_idx
  on public.admission_requests (created_at desc);

alter table public.admission_requests enable row level security;

-- 익명 방문자는 기본 필드만 넣을 수 있다 (status/memo는 기본값 강제).
drop policy if exists "anon can submit admission" on public.admission_requests;
create policy "anon can submit admission"
  on public.admission_requests
  for insert
  to anon
  with check (status = '신규' and memo is null);

drop policy if exists "staff can read admission" on public.admission_requests;
create policy "staff can read admission"
  on public.admission_requests
  for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

drop policy if exists "staff can update admission" on public.admission_requests;
create policy "staff can update admission"
  on public.admission_requests
  for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

-- 테이블 권한: anon은 INSERT만, authenticated는 SELECT/UPDATE만.
revoke all on public.admission_requests from anon, authenticated;
grant insert on public.admission_requests to anon;
grant select, update on public.admission_requests to authenticated;
