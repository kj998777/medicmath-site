import type { MetadataRoute } from "next";

// 검색엔진 안내: 공개 페이지는 모두 허용. (관리자 화면은 비밀 주소 + noindex라 여기 적지 않는다 — 적으면 주소가 드러남)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://www.medicmath.com/sitemap.xml",
    host: "https://www.medicmath.com",
  };
}
