// 관리자 화면의 "숨은 주소".
//
// · 실제 관리자 화면 코드는 app/admin 아래에 있지만, /admin 으로 직접 들어오면 미들웨어가 404를 돌려준다.
// · Vercel 환경변수 ADMIN_PATH 에 정한 비밀 주소(예: /medic-k3v9x2q7w1)로 들어올 때만
//   미들웨어가 내부적으로 /admin 화면을 보여준다. 주소창에는 비밀 주소가 그대로 남는다.
// · ADMIN_PATH 가 없거나 너무 짧으면(12자 미만) 관리자 화면은 아예 열리지 않는다.
// · 비밀 주소를 알아도 메딕차트 admin/editor 계정으로 로그인해야만 내용이 보인다 (이중 잠금).

const VALID = /^[A-Za-z0-9_-]{12,64}$/;

export function adminSlug(): string | null {
  const raw = (process.env.ADMIN_PATH ?? "").trim().replace(/^\/+|\/+$/g, "");
  return VALID.test(raw) ? raw : null;
}

/** 관리자 화면 안에서 링크·이동에 쓰는 기준 주소 (예: "/medic-k3v9x2q7w1"). */
export function adminBase(): string {
  const slug = adminSlug();
  if (!slug) throw new Error("ADMIN_PATH not configured");
  return "/" + slug;
}
