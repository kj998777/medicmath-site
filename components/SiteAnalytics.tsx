"use client";

import { Analytics } from "@vercel/analytics/react";

// Vercel Web Analytics(무료): 방문자 수·어디서 들어왔는지.
// 관리자 화면(비밀 주소)은 기록하지 않는다 — 공개 첫 화면("/")만 센다.
export default function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const path = new URL(event.url).pathname;
          return path === "/" ? event : null;
        } catch {
          return null;
        }
      }}
    />
  );
}
