import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// 관리자 화면(서버 컴포넌트/서버 액션)용 Supabase 클라이언트.
// 로그인한 사용자의 세션 쿠키로 동작하므로 모든 읽기·쓰기가 RLS상 "그 사용자 본인" 권한으로 실행된다.
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // 서버 컴포넌트에서는 쓰기가 무시될 수 있음 — 미들웨어가 세션 갱신을 담당.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // 위와 동일.
        }
      },
    },
  });
}
