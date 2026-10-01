"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { sanitizeContent } from "@/lib/content";

const STATUSES = ["신규", "연락완료", "테스트예정", "입학", "보류"] as const;

export type ActionResult = { ok: boolean; message: string };

export async function updateAdmission(id: string, status: string, memo: string): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, message: "권한이 없습니다. 다시 로그인해 주세요." };
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "잘못된 요청입니다." };
  if (!(STATUSES as readonly string[]).includes(status)) return { ok: false, message: "상태 값이 올바르지 않습니다." };

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("admission_requests")
    .update({ status, memo: memo.trim().slice(0, 1000) || null })
    .eq("id", id);
  if (error) return { ok: false, message: "저장하지 못했습니다: " + error.message };
  revalidatePath("/admin");
  return { ok: true, message: "저장했습니다." };
}

// 신청 1건 영구 삭제. 되돌릴 수 없으므로 화면에서 2단계 확인 후에만 호출된다.
// DB에 삭제 권한(0016 SQL)이 없으면 RLS가 0건 삭제로 조용히 넘어가므로, 삭제된 건수로 성공 여부를 판단한다.
export async function deleteAdmission(id: string): Promise<ActionResult> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, message: "권한이 없습니다. 다시 로그인해 주세요." };
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "잘못된 요청입니다." };

  const supabase = createServerSupabase();
  const { error, count } = await supabase.from("admission_requests").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: "삭제하지 못했습니다: " + error.message };
  if (!count) return { ok: false, message: "삭제하지 못했습니다. 삭제 권한 SQL(0016)이 실행됐는지 확인해 주세요." };
  revalidatePath("/admin");
  return { ok: true, message: "삭제했습니다." };
}

export async function saveContent(raw: unknown, baseAt: string | null = null): Promise<ActionResult & { savedAt?: string }> {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return { ok: false, message: "권한이 없습니다. 다시 로그인해 주세요." };
  }
  const data = sanitizeContent(raw);
  const supabase = createServerSupabase();
  // 이 화면을 연 뒤 다른 곳에서 저장됐으면(다른 탭·기기, Claude의 SQL 수정) 그 내용을 덮어쓰지 않는다.
  const { data: cur } = await supabase.from("site_content").select("updated_at").eq("id", "main").maybeSingle();
  if (cur?.updated_at && (!baseAt || new Date(cur.updated_at).getTime() > new Date(baseAt).getTime() + 1)) {
    return {
      ok: false,
      message: "이 화면을 연 뒤 다른 곳에서 내용이 바뀌었습니다. 덮어쓰지 않았어요 — 고친 내용을 메모해 두고 새로고침한 뒤 다시 저장해 주세요.",
    };
  }
  const savedAt = new Date().toISOString();
  const { error } = await supabase
    .from("site_content")
    .upsert({ id: "main", data, updated_at: savedAt, updated_by: staff.email });
  if (error) return { ok: false, message: "저장하지 못했습니다: " + error.message };
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { ok: true, message: "저장했습니다. 사이트에 바로 반영됩니다.", savedAt };
}

export async function signOut(): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
}
