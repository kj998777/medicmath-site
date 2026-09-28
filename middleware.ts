import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminSlug } from "@/lib/adminPath";

// 1) /admin 으로 직접 오는 요청은 존재하지 않는 페이지처럼 404.
// 2) 비밀 주소(ADMIN_PATH)로 오는 요청만 내부적으로 /admin 화면으로 바꿔 보여주고,
//    그때만 Supabase 로그인 세션을 갱신한다. 공개 페이지는 세션을 건드리지 않는다.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = adminSlug();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }

  const secret = slug ? "/" + slug : null;
  if (!secret || (pathname !== secret && !pathname.startsWith(secret + "/"))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin" + pathname.slice(secret.length);

  let response = NextResponse.rewrite(url, { request: { headers: request.headers } });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.rewrite(url, { request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.rewrite(url, { request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });
  await supabase.auth.getUser();

  // 검색엔진에 관리자 화면이 잡히지 않게.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
