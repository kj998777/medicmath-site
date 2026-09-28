-- 메딕수학 홍보사이트: 관리자 화면에서 입학 신청 삭제 허용
-- 메딕차트와 같은 Supabase 프로젝트의 SQL Editor에서 한 번 실행한다. (0014 실행 후)
-- 메딕차트 admin/editor 계정만 삭제 가능. 방문자(anon)와 그 외 계정은 여전히 불가.

drop policy if exists "staff can delete admission" on public.admission_requests;
create policy "staff can delete admission"
  on public.admission_requests
  for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'editor')));

grant delete on public.admission_requests to authenticated;
