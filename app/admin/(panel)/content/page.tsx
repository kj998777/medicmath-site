import { createServerSupabase } from "@/lib/supabase/server";
import { sanitizeContent } from "@/lib/content";
import ContentEditor from "./ContentEditor";

export default async function ContentPage() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("site_content").select("data, updated_at, updated_by").eq("id", "main").maybeSingle();
  const content = sanitizeContent(data?.data ?? null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-bold">사이트 내용 수정</h1>
        <p className="text-sm text-muted">
          고친 뒤 맨 아래 <b>저장</b>을 누르면 사이트에 바로 반영됩니다. 칸을 비워 두면 사이트에서도 비어 보여요.
          {data?.updated_at && (
            <>
              {" "}마지막 저장: {new Date(data.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
              {data.updated_by ? ` (${data.updated_by})` : ""}
            </>
          )}
        </p>
      </div>
      {error && (
        <p className="rounded border border-brand/40 bg-white p-4 text-sm text-brand">
          저장된 내용을 불러오지 못했습니다. 사이트 내용용 표(0015 SQL)가 실행됐는지 확인해 주세요. ({error.message})
        </p>
      )}
      <ContentEditor initial={content} />
    </div>
  );
}
