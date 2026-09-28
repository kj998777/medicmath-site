import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

export type Staff = { userId: string; email: string; role: "admin" | "editor" };

// 로그인 + 메딕차트 profiles.role 이 admin/editor 인지 확인한다.
// 관리자 화면(레이아웃)과 모든 서버 액션에서 각각 다시 호출한다 — 화면만 막고 액션을 안 막으면
// 주소를 아는 사람이 액션을 직접 호출할 수 있기 때문.
export async function getStaff(): Promise<{ staff: Staff | null; loggedIn: boolean; email?: string }> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { staff: null, loggedIn: false };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (role === "admin" || role === "editor") {
    return { staff: { userId: user.id, email: user.email ?? "", role }, loggedIn: true, email: user.email ?? "" };
  }
  return { staff: null, loggedIn: true, email: user.email ?? "" };
}

export async function requireStaff(): Promise<Staff> {
  const { staff } = await getStaff();
  if (!staff) throw new Error("권한이 없습니다.");
  return staff;
}
