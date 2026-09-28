import type { Config } from "tailwindcss";

// 색은 로고(검정 Σ, 붉은 십자, 웜그레이 영문)와 디자인 캔버스에서 그대로 가져왔다.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1A16", // 본문·검정 배경
        paper: "#F7F5F1", // 기본 바탕
        sand: "#EDE9E2", // 입학 안내 등 보조 바탕
        line: "#E4DFD7", // 구분선·카드 테두리
        field: "#CFC8BC", // 입력칸 테두리
        muted: "#5C534A", // 보조 본문
        soft: "#D9CFC2", // 검정 배경 위 보조 글자
        brand: {
          DEFAULT: "#A83232", // 로고 십자 빨강 — 주요 버튼·포인트
          dark: "#8A2A2A",
          light: "#E08A8A", // 검정 배경 위 빨강 글자
        },
      },
      fontFamily: {
        serif: ["'Noto Serif KR'", "'Noto Serif CJK KR'", "serif"],
        sans: ["'IBM Plex Sans KR'", "'Noto Sans KR'", "'Apple SD Gothic Neo'", "sans-serif"],
      },
      maxWidth: {
        page: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
