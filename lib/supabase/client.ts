"use client";

import { createBrowserClient } from "@supabase/ssr";

// 브라우저용 Supabase 클라이언트 (관리자 화면의 로그인·사진 업로드에서만 사용).
// anon 키만 쓰고, 실제 권한은 RLS와 Storage 정책이 막는다. 서비스 롤 키는 절대 넣지 말 것.
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
