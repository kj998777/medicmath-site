import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteAnalytics from "@/components/SiteAnalytics";
import { NAVER_SITE_VERIFICATION, GOOGLE_SITE_VERIFICATION } from "@/lib/seoVerify";

// 대표 주소(2026-10-01 구매). medicmath.com·medicmath-site.vercel.app은 이 주소로 넘어온다.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.medicmath.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "메딕수학 | 제주시 중·고등 수학 전문 학원",
  description:
    "결심한 학생과 함께합니다. 제주시 중앙로 메딕수학 — 제주 학교 기출을 직접 분석하는 메딕차트로 내신·수능을 준비하는 중·고등 수학 전문 학원입니다.",
  keywords: ["제주시 수학학원", "제주 수학학원", "제주 고등수학", "제주 중등수학", "제주 내신 수학", "메딕수학", "메딕차트", "이도동 수학학원"],
  verification: {
    ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
    ...(NAVER_SITE_VERIFICATION ? { other: { "naver-site-verification": NAVER_SITE_VERIFICATION } } : {}),
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "메딕수학 | 결심한 학생과 함께합니다",
    description: "제주시 중앙로 312 · 중·고등 수학 전문 학원",
    images: ["/logo.png"],
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1A16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 스크롤 애니메이션용: 자바스크립트가 켜져 있을 때만 'js' 표시 → 그때만 요소를 처음에 숨긴다 */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
