-- 메딕수학 홍보사이트: 사이트 내용(글) 저장 표 + 사진 저장소
-- 메딕차트와 같은 Supabase 프로젝트의 SQL Editor에서 한 번 실행한다. (0014를 먼저 실행해 두었어야 함)
--
-- 권한 설계
--   · 누구나(anon): 사이트 내용 읽기, 사진 보기 — 공개 홈페이지에 보여야 하므로.
--   · 메딕차트 admin/editor: 사이트 내용 저장, 사진 올리기·바꾸기·지우기.
--   · 그 외(viewer, tutor, 대기, 비로그인): 쓰기 불가.

-- 1) 사이트 내용 표 (한 줄짜리: id = 'main')
create table if not exists public.site_content (
  id          text primary key check (id = 'main'),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

alter table public.site_content enable row level security;

drop policy if exists "public can read site content" on public.site_content;
create policy "public can read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (true);

drop policy if exists "staff can insert site content" on public.site_content;
create policy "staff can insert site content"
  on public.site_content
  for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

drop policy if exists "staff can update site content" on public.site_content;
create policy "staff can update site content"
  on public.site_content
  for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

-- 2) 사진 저장소 (공개 버킷, 5MB·이미지 형식만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "staff can upload site images" on storage.objects;
create policy "staff can upload site images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  );

drop policy if exists "staff can update site images" on storage.objects;
create policy "staff can update site images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'site-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  );

drop policy if exists "staff can delete site images" on storage.objects;
create policy "staff can delete site images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'site-images'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor'))
  );
-- (공개 버킷이라 사진 "보기"는 정책 없이 공개 주소로 가능. 목록 조회(select) 정책은 일부러 만들지 않음.)
