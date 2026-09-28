import { createServerSupabase } from "@/lib/supabase/server";
import { adminBase } from "@/lib/adminPath";
import AdmissionRow, { type Admission } from "./AdmissionRow";

const STATUSES = ["전체", "신규", "연락완료", "테스트예정", "입학", "보류"];

export default async function AdmissionsPage({ searchParams }: { searchParams: { status?: string } }) {
  const base = adminBase();
  const filter = STATUSES.includes(searchParams.status ?? "") ? searchParams.status! : "전체";

  const supabase = createServerSupabase();
  let q = supabase
    .from("admission_requests")
    .select("id, created_at, student_name, school_grade, phone, recent_score, reason, status, memo")
    .order("created_at", { ascending: false })
    .limit(300);
  if (filter !== "전체") q = q.eq("status", filter);
  const { data, error } = await q;

  const { data: counts } = await supabase.from("admission_requests").select("status");
  const countBy: Record<string, number> = { 전체: counts?.length ?? 0 };
  for (const r of counts ?? []) countBy[r.status] = (countBy[r.status] ?? 0) + 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-bold">상담 신청 현황</h1>
        <p className="text-sm text-muted">사이트의 입학 테스트 신청이 최신순으로 쌓입니다. 행을 눌러 내용을 보고 상태·메모를 바꿀 수 있어요.</p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="상태별 보기">
        {STATUSES.map((s) => {
          const active = s === filter;
          return (
            <a
              key={s}
              href={s === "전체" ? base : `${base}?status=${encodeURIComponent(s)}`}
              className={
                "rounded-full border px-4 py-2 text-sm font-medium " +
                (active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink")
              }
            >
              {s} <span className={active ? "text-soft" : "text-muted"}>{countBy[s] ?? 0}</span>
            </a>
          );
        })}
      </nav>

      {error ? (
        <p className="rounded border border-brand/40 bg-white p-4 text-sm text-brand">
          신청 목록을 불러오지 못했습니다. 신청 저장용 표(0014 SQL)가 실행됐는지 확인해 주세요. ({error.message})
        </p>
      ) : !data || data.length === 0 ? (
        <p className="rounded border border-line bg-white p-8 text-center text-muted">아직 신청이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((a) => (
            <AdmissionRow key={a.id} a={a as Admission} />
          ))}
        </ul>
      )}
    </div>
  );
}
