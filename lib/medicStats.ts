import "server-only";

// 메딕차트 공개 통계(학교·학생 정보 없음)에서 홍보용 숫자만 가져온다.
// 메딕차트에 시험이 새로 등록되면 1분 안에 홍보 숫자도 바뀌도록 60초마다 새로 읽는다(통계 주소는 매번 새로 계산함).
// 실패하면 null — 화면은 숫자 없이도 자연스럽게 보이도록 만든다.
export type MedicStats = { exams: number; items: number; jejuExams: number; units: number };

export async function getMedicStats(): Promise<MedicStats | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("https://medicchart.vercel.app/api/blog/stats", {
      signal: ctrl.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const d = (await res.json()) as { totals?: Record<string, unknown> };
    const t = d.totals ?? {};
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
    const stats = { exams: num(t.exams), items: num(t.items), jejuExams: num(t.jejuExams), units: num(t.units) };
    return stats.exams > 0 && stats.items > 0 ? stats : null;
  } catch {
    return null;
  }
}
