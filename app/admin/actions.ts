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

export async function saveContent(raw: unknown): Promise<ActionResult> {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return { ok: false, message: "권한이 없습니다. 다시 로그인해 주세요." };
  }
  const data = sanitizeContent(raw);
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("site_content")
    .upsert({ id: "main", data, updated_at: new Date().toISOString(), updated_by: staff.email });
  if (error) return { ok: false, message: "저장하지 못했습니다: " + error.message };
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { ok: true, message: "저장했습니다. 사이트에 바로 반영됩니다." };
}

export async function signOut(): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
}
